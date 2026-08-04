import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcBadRequestException } from '@app/common';
import { PaymentGatewayService } from './payment-gateway.service';
import {
  ICheckoutInput,
  ICheckoutSession,
  IPaymentProvider,
  ISubscriptionSnapshot,
  PaymentProviderId,
} from './payment-provider.interface';

/**
 * Stripe behind the neutral payment port.
 *
 * A thin adapter on purpose: PaymentGatewayService stays the Stripe SDK layer
 * (webhook ingestion still needs its Stripe-typed surface), and this translates
 * that into the provider-neutral shapes SubscriptionService works with.
 */
@Injectable()
export class StripePaymentProvider implements IPaymentProvider {
  readonly id: PaymentProviderId = 'stripe';
  readonly supportsBillingPortal = true;

  constructor(
    private readonly gateway: PaymentGatewayService,
    private readonly config: ConfigService,
  ) {}

  isConfigured(): boolean {
    return !!this.config.get<string>('stripe.secretKey');
  }

  async createCheckout(input: ICheckoutInput): Promise<ICheckoutSession> {
    const session = await this.gateway.createCheckoutSession({
      userId: input.userId,
      planId: input.planId,
      priceId: input.priceReference,
      customerId: input.customerReference,
      trialDays: input.trialDays,
    });
    if (!session.url) {
      throw new RpcBadRequestException('Stripe did not return a checkout URL');
    }
    return { reference: session.id, url: session.url };
  }

  async createBillingPortal(
    customerReference: string,
  ): Promise<{ url: string }> {
    const session =
      await this.gateway.createBillingPortalSession(customerReference);
    return { url: session.url };
  }

  async cancelAtPeriodEnd(
    providerSubscriptionId: string,
  ): Promise<ISubscriptionSnapshot> {
    const subscription = await this.gateway.cancelAtPeriodEnd(
      providerSubscriptionId,
    );
    return {
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      // Stripe moved the period boundary onto the individual items; the
      // subscription ends when its last item does.
      currentPeriodEnd: this.periodEnd(subscription.items.data),
    };
  }

  private periodEnd(items: Array<{ current_period_end: number }>): Date | null {
    if (!items.length) return null;
    const latest = Math.max(...items.map((item) => item.current_period_end));
    return new Date(latest * 1000);
  }
}
