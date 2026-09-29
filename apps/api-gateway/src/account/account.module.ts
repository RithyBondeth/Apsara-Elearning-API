import { Module } from '@nestjs/common';
import { JwtModule, RabbitmqModule } from '@app/common';
import {
  AI_SERVICE,
  ASSESSMENT_SERVICE,
  AUTH_SERVICE,
  COURSE_SERVICE,
  SUBSCRIPTION_SERVICE,
  USER_SERVICE,
} from '@app/contracts';
import { AccountController } from './account.controller';

/** Account-level actions that span services: data export and deletion. */
@Module({
  imports: [
    JwtModule,
    RabbitmqModule.register([
      { name: AUTH_SERVICE.NAME, queueKey: 'rabbitmq.authQueue' },
      { name: USER_SERVICE.NAME, queueKey: 'rabbitmq.userQueue' },
      { name: COURSE_SERVICE.NAME, queueKey: 'rabbitmq.courseQueue' },
      { name: ASSESSMENT_SERVICE.NAME, queueKey: 'rabbitmq.assessmentQueue' },
      {
        name: SUBSCRIPTION_SERVICE.NAME,
        queueKey: 'rabbitmq.subscriptionQueue',
      },
      { name: AI_SERVICE.NAME, queueKey: 'rabbitmq.aiQueue' },
    ]),
  ],
  controllers: [AccountController],
})
export class AccountModule {}
