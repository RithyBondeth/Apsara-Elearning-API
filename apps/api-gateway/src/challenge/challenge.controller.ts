import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ASSESSMENT_SERVICE,
  CreateSubmissionRequestDTO,
} from '@app/contracts';
import { CurrentUser, JwtAuthGuard } from '@app/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { rpcCall } from '../utils/rpc-call';

@ApiTags('Coding Challenges')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('challenge')
export class ChallengeController {
  constructor(
    @Inject(ASSESSMENT_SERVICE.NAME) private readonly client: ClientProxy,
  ) {}

  @Get('lesson/:lessonId')
  findByLesson(@Param('lessonId') lessonId: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.CHALLENGE_FIND_ALL, {
      lessonId,
    });
  }

  // Literal segments declared before `:id` so they aren't captured as an id.
  @Get('submissions')
  mySubmissions(@CurrentUser('id') userId: string) {
    return rpcCall(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.SUBMISSION_FIND_ALL,
      { userId },
    );
  }

  @Get('submission/:id')
  submission(@Param('id') id: string) {
    return rpcCall(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.SUBMISSION_FIND_ONE,
      { id },
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const challenge = await rpcCall<Record<string, unknown>>(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.CHALLENGE_FIND_ONE,
      { id },
    );
    // Never expose the reference solution to students.
    delete challenge.solutionCode;
    return challenge;
  }

  @Get(':id/test-cases')
  testCases(@Param('id') id: string) {
    // Service returns visible (non-hidden) cases only for this payload shape.
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.TEST_CASE_FIND_ALL, {
      challengeId: id,
    });
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  submit(
    @CurrentUser('id') userId: string,
    @Param('id') challengeId: string,
    @Body() dto: CreateSubmissionRequestDTO,
  ) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.SUBMISSION_CREATE, {
      userId,
      challengeId,
      sourceCode: dto.sourceCode,
      language: dto.language,
    });
  }
}
