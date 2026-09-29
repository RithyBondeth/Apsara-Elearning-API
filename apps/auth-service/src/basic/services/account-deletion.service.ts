import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { user } from '@app/database/schemas/user/user.schema';
import {
  AccountDeletionPayloadDTO,
  AccountDeletionResponseDTO,
  accountDeletionDueAt,
  DRIZZLE,
  IAccountDeletionService,
} from '@app/contracts';
import {
  EmailService,
  RpcNotFoundException,
  RpcUnauthorizedException,
} from '@app/common';

/**
 * Starts the self-service deletion grace period. The account itself is removed
 * later by user-service's purge job; signing in before then (LoginService)
 * cancels it.
 */
@Injectable()
export class AccountDeletionService implements IAccountDeletionService {
  private readonly logger = new Logger(AccountDeletionService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    private readonly emailService: EmailService,
  ) {}

  async request(
    dto: AccountDeletionPayloadDTO,
  ): Promise<AccountDeletionResponseDTO> {
    const [found] = await this.db
      .select({
        id: user.id,
        email: user.email,
        password: user.password,
        deletionRequestedAt: user.deletionRequestedAt,
      })
      .from(user)
      .where(eq(user.id, dto.userId))
      .limit(1);
    if (!found) throw new RpcNotFoundException('User not found');

    // A valid access token alone isn't enough — someone at an unlocked device
    // shouldn't be able to erase the owner's account.
    if (!(await bcrypt.compare(dto.password, found.password))) {
      throw new RpcUnauthorizedException('Password is incorrect');
    }

    // Asking twice keeps the original date rather than pushing it back.
    const requestedAt = found.deletionRequestedAt ?? new Date();
    const deleteAfter = accountDeletionDueAt(requestedAt);

    // Signs the learner out everywhere: with the refresh token gone, every
    // session ends when its access token expires, and refresh is refused
    // while a deletion is pending (TokenService).
    await this.db
      .update(user)
      .set({
        deletionRequestedAt: requestedAt,
        refreshToken: null,
        refreshTokenExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, found.id));

    if (!found.deletionRequestedAt) {
      try {
        await this.emailService.sendAccountDeletionEmail(
          found.email,
          deleteAfter,
        );
      } catch (error) {
        // The request stands without the email; the owner can still cancel
        // by signing in.
        this.logger.error(
          `Deletion email failed for ${found.id}: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    this.logger.log(
      `Account deletion requested: ${found.id}, due ${deleteAfter.toISOString()}`,
    );
    return new AccountDeletionResponseDTO({ deleteAfter });
  }
}
