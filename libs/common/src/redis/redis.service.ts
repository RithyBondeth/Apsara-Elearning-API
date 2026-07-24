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
