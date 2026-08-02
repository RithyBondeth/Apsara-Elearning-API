import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import type { Redis } from 'ioredis';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';

/** Global default: 120 requests / minute / IP. */
export const DEFAULT_THROTTLE = { ttl: 60_000, limit: 120 };

/**
 * Builds the throttler options. When a Redis client is present the counters are
 * shared across replicas; otherwise they fall back to per-instance memory.
 */
export function buildThrottlerOptions(
  redis: Redis | null,
): ThrottlerModuleOptions {
  return {
    throttlers: [DEFAULT_THROTTLE],
    storage: redis ? new ThrottlerStorageRedisService(redis) : undefined,
  };
}
