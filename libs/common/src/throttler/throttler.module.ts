import { Module } from '@nestjs/common';
import { ThrottlerModule as NestThrottlerModule } from '@nestjs/throttler';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT, RedisModule } from '../redis';
import { JwtModule } from '../jwt/jwt.module';
import { buildThrottlerOptions } from './throttler.config';
import { GatewayThrottlerGuard } from './throttler.guard';

/**
 * Rate limiting wired to the shared Redis client (falls back to in-memory when
 * Redis isn't configured). Import in a gateway and pair with an APP_GUARD of
 * GatewayThrottlerGuard; tighten specific routes with @Throttle.
 */
@Module({
  imports: [
    RedisModule,
    JwtModule,
    NestThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [REDIS_CLIENT],
      useFactory: (redis: Redis | null) => buildThrottlerOptions(redis),
    }),
  ],
  providers: [GatewayThrottlerGuard],
  exports: [NestThrottlerModule, GatewayThrottlerGuard],
})
export class ThrottlerModule {}
