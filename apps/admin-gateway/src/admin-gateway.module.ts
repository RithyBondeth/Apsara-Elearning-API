import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  AdminGuard,
  ConfigurationModule,
  JwtModule,
  LoggerModule,
} from '@app/common';
import { TaxonomyModule } from './taxonomy/taxonomy.module';
import { CourseModule } from './course/course.module';
import { UserModule } from './user/user.module';
import { AssessmentModule } from './assessment/assessment.module';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports: [
    ConfigurationModule,
    LoggerModule,
    JwtModule,
    TaxonomyModule,
    CourseModule,
    UserModule,
    AssessmentModule,
    SubscriptionModule,
  ],
  // Every admin-gateway route requires an authenticated admin.
  providers: [{ provide: APP_GUARD, useClass: AdminGuard }],
})
export class AdminGatewayModule {}
