import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.constant';

/**
 * Thin JSON cache over the shared ioredis client. Every method degrades safely
 * when Redis is not configured (`client` is null), so callers never have to
 * guard for it.
 */
@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly prefix = 'apsara-elearning';

  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis | null) {}

  /** Namespaced cache key, e.g. `apsara-elearning:course:detail:<id>`. */
  key(entity: string, type: string, id: string): string {
    return `${this.prefix}:${entity}:${type}:${id}`;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const value = await this.client.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      this.logger.error(
        `Cache GET failed for ${key}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    try {
      const payload = JSON.stringify(value);
      if (ttlSeconds) await this.client.set(key, payload, 'EX', ttlSeconds);
      else await this.client.set(key, payload);
    } catch (error) {
      this.logger.error(
        `Cache SET failed for ${key}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Atomically increments a counter and returns its new value.
   *
   * The TTL is reapplied on every call, so the window slides from the most
   * recent hit rather than the first. Deliberately a plain EXPIRE: the `NX`
   * flag that would pin the window to the first hit needs Redis 7.0+, and on
   * an older server it errors while the INCR still lands — leaving a counter
   * that never expires. For a lockout, sliding is also the better behaviour:
   * a caller who keeps hammering stays locked.
   *
   * Returns null when Redis is not configured — callers must treat that as
   * "no opinion" rather than as a zero count.
   */
  async incr(key: string, ttlSeconds: number): Promise<number | null> {
    if (!this.client) return null;
    try {
      const results = await this.client
        .multi()
        .incr(key)
        .expire(key, ttlSeconds)
        .exec();
      const [incrError, count] = results?.[0] ?? [];
      if (incrError) throw incrError;
      return typeof count === 'number' ? count : null;
    } catch (error) {
      this.logger.error(
        `Cache INCR failed for ${key}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(
        `Cache DEL failed for ${key}: ${(error as Error).message}`,
      );
    }
  }
}
