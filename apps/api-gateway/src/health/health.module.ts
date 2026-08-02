import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { InternalServiceHealthIndicator, RabbitmqModule } from '@app/common';
import {
  AI_SERVICE,
  ASSESSMENT_SERVICE,
  AUTH_SERVICE,
  COURSE_SERVICE,
  SUBSCRIPTION_SERVICE,
  USER_SERVICE,
} from '@app/contracts';
import { HealthController } from './controllers/health.controller';

/**
 * Registers a client to every microservice queue so the health controller can
 * ping them all. Mirrors the reference gateway's health module, adapted from
 * TCP to this repo's RabbitMQ transport.
 */
@Module({
  imports: [
    TerminusModule,
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
  controllers: [HealthController],
  providers: [InternalServiceHealthIndicator],
})
export class HealthModule {}
