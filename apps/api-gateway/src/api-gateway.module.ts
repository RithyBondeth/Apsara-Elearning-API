import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigurationModule, LoggerModule } from '@app/common';
import { CourseModule } from './course/course.module';
import { QuizModule } from './quiz/quiz.module';
import { AiModule } from './ai/ai.module';
import { ChallengeModule } from './challenge/challenge.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigurationModule,
    LoggerModule,
    // Global default: 120 requests / minute / IP. Sensitive routes tighten
    // this with @Throttle (see auth + subscription controllers). Uses Redis
    // (shared across replicas) when REDIS_URL is set, else in-memory.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('redis.url');
        return {
          throttlers: [{ ttl: 60_000, limit: 120 }],
          storage: redisUrl
            ? new ThrottlerStorageRedisService(new Redis(redisUrl))
            : undefined,
        };
      },
    }),
    AuthModule,
    UserModule,
    CourseModule,
    QuizModule,
    AiModule,
    ChallengeModule,
    SubscriptionModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class ApiGatewayModule {}
