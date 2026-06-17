import { Module } from '@nestjs/common';
import { JwtModule, RabbitmqModule } from '@app/common';
import { SUBSCRIPTION_SERVICE } from '@app/contracts';
import { SubscriptionController } from './subscription.controller';

@Module({
  imports: [
    JwtModule,
    RabbitmqModule.register([
      {
        name: SUBSCRIPTION_SERVICE.NAME,
        queueKey: 'rabbitmq.subscriptionQueue',
      },
    ]),
  ],
  controllers: [SubscriptionController],
})
export class SubscriptionModule {}
