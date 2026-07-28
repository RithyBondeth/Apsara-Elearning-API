import { Module } from '@nestjs/common';
import { RabbitmqModule } from '@app/common';
import { SUBSCRIPTION_SERVICE } from '@app/contracts';
import { PlanController } from './controllers/plan.controller';
import { PaymentController } from './controllers/payment.controller';
import { EntitlementController } from './controllers/entitlement.controller';

@Module({
  imports: [
    RabbitmqModule.register([
      {
        name: SUBSCRIPTION_SERVICE.NAME,
        queueKey: 'rabbitmq.subscriptionQueue',
      },
    ]),
  ],
  controllers: [PlanController, PaymentController, EntitlementController],
})
export class SubscriptionModule {}
