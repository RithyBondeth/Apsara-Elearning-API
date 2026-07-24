import { Module } from '@nestjs/common';
import { ConfigurationModule, LoggerModule, HealthModule } from '@app/common';
import { DatabaseModule } from '@app/database';
import {
  I_PAYMENT_SERVICE,
  I_PLAN_SERVICE,
  I_SUBSCRIPTION_SERVICE,
} from '@app/contracts';
import { SubscriptionHealthController } from './health/health.controller';
import { SubscriptionController } from './controllers/subscription.controller';
import { PlanService } from './services/plan.service';
import { SubscriptionService } from './services/subscription.service';
import { PaymentService } from './services/payment.service';
import { PaymentGatewayService } from './payment/payment-gateway.service';

@Module({
  imports: [ConfigurationModule, LoggerModule, DatabaseModule, HealthModule],
  controllers: [SubscriptionController, SubscriptionHealthController],
  providers: [
    // Concrete classes stay injectable (services inject each other directly,
    // keeping real Drizzle return types); the interface tokens alias the same
    // instance for the controller to depend on.
    PlanService,
    PaymentService,
    SubscriptionService,
    { provide: I_PLAN_SERVICE, useExisting: PlanService },
    { provide: I_PAYMENT_SERVICE, useExisting: PaymentService },
    { provide: I_SUBSCRIPTION_SERVICE, useExisting: SubscriptionService },
    PaymentGatewayService,
  ],
})
export class SubscriptionServiceModule {}
