import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { RedisService, RpcTooManyRequestsException } from '@app/common';

/** Failed attempts allowed per email before the account is locked out. */
export const MAX_FAILED_ATTEMPTS = 10;
/**
 * How long the lockout — and the counter behind it — lasts, measured from the
 * most recent failed attempt (see RedisService.incr).
 */
export const LOCKOUT_SECONDS = 15 * 60;

/**
 * Per-email lockout for credential stuffing.
 *
 * The gateway's rate limiter buckets by IP, which an attacker distributes
 * around; this counts failures against the account being targeted instead, so
 * a stuffing run is capped no matter how many source addresses it uses.
 *
 * Only *failed* attempts count and a success clears the counter, so a learner
 * who mistypes their password a few times is never locked out by their own
 * successful logins.
 *
 * Degrades to no protection when Redis is unconfigured — the same posture the
 * throttler already takes.
 */
@Injectable()
export class LoginAttemptsService {
  private readonly logger = new Logger(LoginAttemptsService.name);

  constructor(private readonly redis: RedisService) {}

  /** Emails are PII; key on a digest so they never sit in Redis in the clear. */
  private keyFor(email: string): string {
    const digest = createHash('sha256')
      .update(email.trim().toLowerCase())
      .digest('hex');
    return this.redis.key('auth', 'login-failures', digest);
  }

  /** Throws 429 when this email has already burned through its attempts. */
  async assertNotLockedOut(email: string): Promise<void> {
    const count = await this.redis.get<number>(this.keyFor(email));
    if (count !== null && count >= MAX_FAILED_ATTEMPTS) {
      throw new RpcTooManyRequestsException(
        'Too many failed sign-in attempts. Please try again later.',
      );
    }
  }

  async recordFailure(email: string): Promise<void> {
    const count = await this.redis.incr(this.keyFor(email), LOCKOUT_SECONDS);
    if (count === MAX_FAILED_ATTEMPTS) {
      // Deliberately no email in the log line — the digest is enough to
      // correlate, and support can hash an address to match it.
      this.logger.warn(
        `Login lockout triggered after ${count} failures (${this.keyFor(email)})`,
      );
    }
  }

  async clear(email: string): Promise<void> {
    await this.redis.del(this.keyFor(email));
  }
}
