import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigurationModule, LoggerModule } from '@app/common';
import { CourseModule } from './course/course.module';
import { QuizModule } from './quiz/quiz.module';
import { AiModule } from './ai/ai.module';
import { ChallengeModule } from './challenge/challenge.module';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports: [
    ConfigurationModule,
    LoggerModule,
    AuthModule,
    UserModule,
    CourseModule,
    QuizModule,
    AiModule,
    ChallengeModule,
    SubscriptionModule,
  ],
})
export class ApiGatewayModule {}
