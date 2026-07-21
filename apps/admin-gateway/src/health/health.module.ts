import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { InternalServiceHealthIndicator, RabbitmqModule } from '@app/common';
import {
  ASSESSMENT_SERVICE,
  COURSE_SERVICE,
  SUBSCRIPTION_SERVICE,
  USER_SERVICE,
} from '@app/contracts';
import { HealthController } from './controllers/health.controller';

/**
 * Registers a client to each admin-facing microservice queue so the health
 * controller can ping them. Mirrors the api-gateway health module.
 */
@Module({
  imports: [
    TerminusModule,
    RabbitmqModule.register([
      { name: COURSE_SERVICE.NAME, queueKey: 'rabbitmq.courseQueue' },
      { name: USER_SERVICE.NAME, queueKey: 'rabbitmq.userQueue' },
      { name: ASSESSMENT_SERVICE.NAME, queueKey: 'rabbitmq.assessmentQueue' },
      {
        name: SUBSCRIPTION_SERVICE.NAME,
        queueKey: 'rabbitmq.subscriptionQueue',
      },
    ]),
  ],
  controllers: [HealthController],
  providers: [InternalServiceHealthIndicator],
})
export class HealthModule {}
