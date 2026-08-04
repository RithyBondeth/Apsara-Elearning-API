import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import {
  ConfigurationModule,
  GatewayThrottlerGuard,
  LoggerModule,
  ThrottlerModule,
} from '@app/common';
import { CourseModule } from './course/course.module';
import { QuizModule } from './quiz/quiz.module';
import { AiModule } from './ai/ai.module';
import { ChallengeModule } from './challenge/challenge.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { HealthModule } from './health/health.module';
import { SupportModule } from './support/support.module';

@Module({
  imports: [
    ConfigurationModule,
    LoggerModule,
    // 120 requests / minute per user (or per client IP when anonymous),
    // Redis-backed when configured. Sensitive routes tighten this with
    // @Throttle (see auth + subscription).
    ThrottlerModule,
    AuthModule,
    UserModule,
    CourseModule,
    QuizModule,
    AiModule,
    ChallengeModule,
    SubscriptionModule,
    SupportModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useExisting: GatewayThrottlerGuard }],
})
export class ApiGatewayModule {}
