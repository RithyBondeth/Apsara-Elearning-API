import { Module } from '@nestjs/common';
import { ThrottlerModule as NestThrottlerModule } from '@nestjs/throttler';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT, RedisModule } from '../redis';
import { buildThrottlerOptions } from './throttler.config';

/**
 * Rate limiting wired to the shared Redis client (falls back to in-memory when
 * Redis isn't configured). Import in a gateway and pair with an APP_GUARD of
 * ThrottlerGuard; tighten specific routes with @Throttle.
 */
@Module({
  imports: [
    RedisModule,
    NestThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [REDIS_CLIENT],
      useFactory: (redis: Redis | null) => buildThrottlerOptions(redis),
    }),
  ],
  exports: [NestThrottlerModule],
})
export class ThrottlerModule {}
