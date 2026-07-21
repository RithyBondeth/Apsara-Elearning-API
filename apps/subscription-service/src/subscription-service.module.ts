import { Module } from '@nestjs/common';
import { ConfigurationModule, LoggerModule } from '@app/common';
import { DatabaseModule } from '@app/database';
import { SubscriptionRpcController } from './controllers/subscription-rpc.controller';
import { PlanRpcService } from './services/plan-rpc.service';
import { SubscriptionRpcService } from './services/subscription-rpc.service';
import { PaymentRpcService } from './services/payment-rpc.service';
import { PaymentGatewayService } from './payment/payment-gateway.service';

@Module({
  imports: [ConfigurationModule, LoggerModule, DatabaseModule],
  controllers: [SubscriptionRpcController],
  providers: [
    PlanRpcService,
    SubscriptionRpcService,
    PaymentRpcService,
    PaymentGatewayService,
  ],
})
export class SubscriptionServiceModule {}
