import { Module } from '@nestjs/common';
import { RabbitmqModule } from '@app/common';
import { SUBSCRIPTION_SERVICE } from '@app/contracts';
import { PlanController } from './plan.controller';
import { PaymentController } from './payment.controller';

@Module({
  imports: [
    RabbitmqModule.register([
      {
        name: SUBSCRIPTION_SERVICE.NAME,
        queueKey: 'rabbitmq.subscriptionQueue',
      },
    ]),
  ],
  controllers: [PlanController, PaymentController],
})
export class SubscriptionModule {}
