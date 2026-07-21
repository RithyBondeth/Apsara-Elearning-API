import { Module } from '@nestjs/common';
import { ConfigurationModule, LoggerModule, HealthModule } from '@app/common';
import { DatabaseModule } from '@app/database';
import { I_PAYMENT_SERVICE, I_PLAN_SERVICE, I_SUBSCRIPTION_SERVICE } from '@app/contracts';
import { SubscriptionHealthController } from './health/health.controller';
import { SubscriptionRpcController } from './controllers/subscription.controller';
import { PlanRpcService } from './services/plan.service';
import { SubscriptionRpcService } from './services/subscription.service';
import { PaymentRpcService } from './services/payment.service';
import { PaymentGatewayService } from './payment/payment-gateway.service';

@Module({
  imports: [ConfigurationModule, LoggerModule, DatabaseModule, HealthModule],
  controllers: [SubscriptionRpcController,
    SubscriptionHealthController,
  ],
  providers: [
    // Concrete classes stay injectable (services inject each other directly,
    // keeping real Drizzle return types); the interface tokens alias the same
    // instance for the controller to depend on.
    PlanRpcService,
    PaymentRpcService,
    SubscriptionRpcService,
    { provide: I_PLAN_SERVICE, useExisting: PlanRpcService },
    { provide: I_PAYMENT_SERVICE, useExisting: PaymentRpcService },
    { provide: I_SUBSCRIPTION_SERVICE, useExisting: SubscriptionRpcService },
    PaymentGatewayService,
  ],
})
export class SubscriptionServiceModule {}
