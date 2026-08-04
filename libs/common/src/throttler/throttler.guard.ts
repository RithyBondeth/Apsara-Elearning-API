import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import type {
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { JwtService } from '../jwt/jwt.service';
import { resolveClientIp, type IRequestLike } from './client-ip';

/**
 * Rate limiting that survives the BFF.
 *
 * The stock guard buckets by socket IP. Every browser request arrives through
 * the web app's server-side proxy, so that IP is identical for the whole user
 * base — one student loading a busy page would spend everyone's budget, and the
 * 5/min auth limits would cap the entire platform at 5 logins per minute.
 *
 * Two trackers instead:
 * - Authenticated calls bucket by user id, taken from a *verified* access token
 *   so it can't be forged to escape a limit.
 * - Anonymous calls (login, register, refresh, public catalog) bucket by the
 *   client IP the BFF declares — see `resolveClientIp`.
 */
@Injectable()
export class GatewayThrottlerGuard extends ThrottlerGuard {
  private readonly proxySecret?: string;

  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    super(options, storageService, reflector);
    this.proxySecret = config.get<string>('internalProxySecret') || undefined;
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const request = req as IRequestLike;
    const userId = await this.userIdOf(request);
    if (userId) return `user:${userId}`;
    return `ip:${resolveClientIp(request, this.proxySecret)}`;
  }

  /**
   * Global guards run before route guards, so `req.user` isn't populated yet —
   * the token is verified here instead. An invalid or expired token simply
   * falls through to IP bucketing.
   */
  private async userIdOf(req: IRequestLike): Promise<string | null> {
    const header = req.headers?.authorization;
    const raw = Array.isArray(header) ? header[0] : header;
    if (typeof raw !== 'string' || !raw.startsWith('Bearer ')) return null;

    try {
      const payload = await this.jwt.verifyToken(raw.slice(7).trim());
      return payload.id;
    } catch {
      return null;
    }
  }
}
