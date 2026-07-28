import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { RpcBadRequestException, RpcInternalException } from '@app/common';

@Injectable()
export class PaymentGatewayService implements OnModuleInit {
  private client?: Stripe;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    if (this.config.get<string>('nodeEnv') !== 'production') return;
    if (
      !this.config.get<string>('stripe.secretKey') ||
      !this.config.get<string>('stripe.webhookSecret')
    ) {
      throw new Error(
        'STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are required in production',
      );
    }
    if (!this.appUrl().startsWith('https://')) {
      throw new Error('WEB_APP_URL must use HTTPS in production');
    }
  }

  async createCheckoutSession(input: {
    userId: string;
    planId: string;
    priceId: string;
    customerId?: string;
    trialDays?: number;
  }): Promise<Stripe.Checkout.Session> {
    const appUrl = this.appUrl();
    return this.stripe().checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: input.priceId, quantity: 1 }],
      client_reference_id: input.userId,
      ...(input.customerId ? { customer: input.customerId } : {}),
      metadata: { userId: input.userId, planId: input.planId },
      subscription_data: {
        metadata: { userId: input.userId, planId: input.planId },
        ...(input.trialDays && input.trialDays > 0
          ? { trial_period_days: input.trialDays }
          : {}),
      },
      allow_promotion_codes: true,
      success_url: `${appUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/courses?checkout=cancelled`,
    });
  }

  async createBillingPortalSession(customerId: string) {
    return this.stripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${this.appUrl()}/dashboard`,
    });
  }

  retrieveSubscription(subscriptionId: string) {
    return this.stripe().subscriptions.retrieve(subscriptionId);
  }

  async invoicePaymentReferences(invoiceId: string): Promise<{
    paymentIntentId?: string;
    chargeId?: string;
  }> {
    const result = await this.stripe().invoicePayments.list({
      invoice: invoiceId,
      limit: 10,
    });
    const payment =
      result.data.find((item) => item.status === 'paid') ?? result.data[0];
    return {
      paymentIntentId: this.idOf(payment?.payment.payment_intent),
      chargeId: this.idOf(payment?.payment.charge),
    };
  }

  async invoiceIdForPaymentIntent(
    paymentIntentId: string,
  ): Promise<string | undefined> {
    const result = await this.stripe().invoicePayments.list({
      payment: { type: 'payment_intent', payment_intent: paymentIntentId },
      limit: 1,
    });
    return this.idOf(result.data[0]?.invoice);
  }

  cancelAtPeriodEnd(subscriptionId: string) {
    return this.stripe().subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const secret = this.config.get<string>('stripe.webhookSecret');
    if (!secret) {
      throw new RpcInternalException('Stripe webhook is not configured');
    }
    try {
      return this.stripe().webhooks.constructEvent(rawBody, signature, secret);
    } catch {
      throw new RpcBadRequestException('Invalid Stripe webhook signature');
    }
  }

  private stripe(): Stripe {
    const secretKey = this.config.get<string>('stripe.secretKey');
    if (!secretKey) {
      throw new RpcInternalException('Stripe billing is not configured');
    }
    this.client ??= new Stripe(secretKey, {
      maxNetworkRetries: 2,
      timeout: 10_000,
    });
    return this.client;
  }

  private appUrl(): string {
    const value = this.config.get<string>('web.appUrl');
    if (!value)
      throw new RpcInternalException('Web application URL is missing');
    return value.replace(/\/$/, '');
  }

  private idOf(value: { id: string } | string | null | undefined) {
    return typeof value === 'string' ? value : value?.id;
  }
}
