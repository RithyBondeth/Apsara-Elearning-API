import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AccountDeletionRequestDTO,
  AccountDeletionResponseDTO,
  AI_SERVICE,
  ASSESSMENT_SERVICE,
  AUTH_SERVICE,
  COURSE_SERVICE,
  NOTIFICATIONS_MAX_LIMIT,
  SUBSCRIPTION_SERVICE,
  USAGE_MAX_LIMIT,
  USER_SERVICE,
} from '@app/contracts';
import { CurrentUser, JwtAuthGuard, rpcCall } from '@app/common';

// Password-confirmed and destructive: same limit as other credential checks.
const STRICT = { default: { limit: 5, ttl: 60_000 } };
// Fans out to every service; a learner has no reason to export often.
const EXPORT = { default: { limit: 3, ttl: 60_000 } };

@ApiTags('Account')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('account')
export class AccountController {
  private readonly logger = new Logger(AccountController.name);

  constructor(
    @Inject(AUTH_SERVICE.NAME) private readonly auth: ClientProxy,
    @Inject(USER_SERVICE.NAME) private readonly users: ClientProxy,
    @Inject(COURSE_SERVICE.NAME) private readonly courses: ClientProxy,
    @Inject(ASSESSMENT_SERVICE.NAME) private readonly assessment: ClientProxy,
    @Inject(SUBSCRIPTION_SERVICE.NAME)
    private readonly subscriptions: ClientProxy,
    @Inject(AI_SERVICE.NAME) private readonly ai: ClientProxy,
  ) {}

  @Post('deletion')
  @HttpCode(HttpStatus.OK)
  @Throttle(STRICT)
  @ApiOperation({
    summary: 'Schedule this account for deletion after a 7-day grace period',
    description:
      'Signs out every session and stops subscription renewal. Signing in ' +
      'again before `deleteAfter` cancels the deletion.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: AccountDeletionResponseDTO })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Password is incorrect',
  })
  async requestDeletion(
    @CurrentUser('id') userId: string,
    @Body() dto: AccountDeletionRequestDTO,
  ): Promise<AccountDeletionResponseDTO> {
    const result = await rpcCall<AccountDeletionResponseDTO>(
      this.auth,
      AUTH_SERVICE.ACTIONS.ACCOUNT_DELETION_REQUEST,
      { userId, password: dto.password },
    );

    // Stop renewals now so the learner isn't charged during the grace
    // period. Best effort here: the purge job stops them again and won't
    // delete the account until that succeeds.
    try {
      await rpcCall(
        this.subscriptions,
        SUBSCRIPTION_SERVICE.ACTIONS.SUBSCRIPTION_STOP_RENEWALS,
        { userId },
        30_000,
      );
    } catch (error) {
      this.logger.warn(
        `Couldn't stop renewals for ${userId} at deletion request: ${error instanceof Error ? error.message : error}`,
      );
    }

    return result;
  }

  @Get('export')
  @Throttle(EXPORT)
  @ApiOperation({
    summary: 'Download everything the platform stores about this account',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'The export as JSON' })
  async export(@CurrentUser('id') userId: string) {
    const byUser = { userId };
    const [
      profile,
      badges,
      notifications,
      enrollments,
      lessonProgress,
      certificates,
      quizAttempts,
      codeSubmissions,
      subscriptions,
      payments,
      conversations,
      aiUsage,
    ] = await Promise.all([
      rpcCall<unknown>(this.users, USER_SERVICE.ACTIONS.FIND_ONE, {
        id: userId,
      }),
      rpcCall<unknown>(
        this.users,
        USER_SERVICE.ACTIONS.BADGE_FIND_BY_USER,
        byUser,
      ),
      rpcCall<unknown>(
        this.users,
        USER_SERVICE.ACTIONS.NOTIFICATION_FIND_BY_USER,
        {
          userId,
          limit: NOTIFICATIONS_MAX_LIMIT,
        },
      ),
      rpcCall<{ courseId: string }[]>(
        this.courses,
        COURSE_SERVICE.ACTIONS.ENROLLMENT_FIND_BY_USER,
        byUser,
      ),
      rpcCall<unknown>(
        this.courses,
        COURSE_SERVICE.ACTIONS.PROGRESS_FIND_BY_USER,
        byUser,
      ),
      rpcCall<unknown>(
        this.courses,
        COURSE_SERVICE.ACTIONS.CERTIFICATE_FIND_BY_USER,
        byUser,
      ),
      rpcCall<unknown>(
        this.assessment,
        ASSESSMENT_SERVICE.ACTIONS.ATTEMPT_FIND_ALL,
        byUser,
      ),
      rpcCall<unknown>(
        this.assessment,
        ASSESSMENT_SERVICE.ACTIONS.SUBMISSION_FIND_ALL,
        byUser,
      ),
      rpcCall<unknown>(
        this.subscriptions,
        SUBSCRIPTION_SERVICE.ACTIONS.SUBSCRIPTION_FIND_BY_USER,
        byUser,
      ),
      rpcCall<unknown>(
        this.subscriptions,
        SUBSCRIPTION_SERVICE.ACTIONS.PAYMENT_FIND_BY_USER,
        byUser,
      ),
      rpcCall<{ id: string }[]>(
        this.ai,
        AI_SERVICE.ACTIONS.CONVERSATION_FIND_ALL,
        byUser,
      ),
      rpcCall<unknown>(this.ai, AI_SERVICE.ACTIONS.USAGE_FIND_BY_USER, {
        userId,
        limit: USAGE_MAX_LIMIT,
      }),
    ]);

    // Ratings are looked up per course; conversations carry their messages.
    const [ratings, aiConversations] = await Promise.all([
      Promise.all(
        enrollments.map((e) =>
          rpcCall<unknown>(
            this.courses,
            COURSE_SERVICE.ACTIONS.RATING_FIND_MINE,
            {
              userId,
              courseId: e.courseId,
            },
          ),
        ),
      ).then((rows) => rows.filter(Boolean)),
      Promise.all(
        conversations.map(async (conversation) => ({
          ...conversation,
          messages: await rpcCall<unknown>(
            this.ai,
            AI_SERVICE.ACTIONS.MESSAGE_FIND_ALL,
            { userId, conversationId: conversation.id },
          ),
        })),
      ),
    ]);

    // Any failed section fails the whole request: a silently partial export
    // would misrepresent what is stored.
    return {
      exportedAt: new Date().toISOString(),
      notes: [
        `Notifications: the most recent ${NOTIFICATIONS_MAX_LIMIT}.`,
        `AI usage records: the most recent ${USAGE_MAX_LIMIT}.`,
        'Ratings: those on courses you are enrolled in.',
        'Card details are held by Stripe and are never stored here.',
      ],
      profile,
      badges,
      notifications,
      enrollments,
      lessonProgress,
      certificates,
      ratings,
      quizAttempts,
      codeSubmissions,
      subscriptions,
      payments,
      aiConversations,
      aiUsage,
    };
  }
}
