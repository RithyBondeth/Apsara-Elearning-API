import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  and,
  desc,
  eq,
  gt,
  isNotNull,
  isNull,
  lte,
  notInArray,
  or,
} from 'drizzle-orm';
import { subscriptions } from '@app/database/schemas/subscription/subscription.schema';
import { plans } from '@app/database/schemas/subscription/plan.schema';
import {
  ActiveSubscriptionResponseDTO,
  BillingPortalResponseDTO,
  CancelSubscriptionResponseDTO,
  CheckoutSessionResponseDTO,
  DRIZZLE,
  ISubscriptionService,
  PlanResponseDTO,
  SubscriptionCheckResponseDTO,
  SubscriptionResponseDTO,
} from '@app/contracts';
import {
  RpcBadRequestException,
  RpcConflictException,
  RpcNotFoundException,
} from '@app/common';
import { PaymentGatewayService } from '../payment/payment-gateway.service';
import { PlanService } from './plan.service';

@Injectable()
export class SubscriptionService implements ISubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    private readonly planService: PlanService,
    private readonly gateway: PaymentGatewayService,
  ) {}

  async createCheckout(
    userId: string,
    planId: string,
  ): Promise<CheckoutSessionResponseDTO> {
    if (await this.hasOpenStripeSubscription(userId)) {
      throw new RpcConflictException(
        'An active subscription already exists; use the billing portal to manage it',
      );
    }
    const plan = await this.planService.findOne(planId);
    if (!plan.stripePriceId) {
      throw new RpcBadRequestException(
        'This plan is not configured for Stripe Checkout',
      );
    }
    if (plan.billingPeriod === 'lifetime') {
      throw new RpcBadRequestException(
        'Lifetime plans are not supported by recurring Checkout',
      );
    }

    const customerId = await this.findStripeCustomerId(userId);
    const session = await this.gateway.createCheckoutSession({
      userId,
      planId,
      priceId: plan.stripePriceId,
      customerId,
      trialDays: plan.trialDays,
    });
    if (!session.url) {
      throw new RpcBadRequestException('Stripe did not return a checkout URL');
    }
    return new CheckoutSessionResponseDTO({
      sessionId: session.id,
      url: session.url,
    });
  }

  async createBillingPortal(userId: string): Promise<BillingPortalResponseDTO> {
    const customerId = await this.findStripeCustomerId(userId);
    if (!customerId) {
      throw new RpcNotFoundException('No Stripe billing account found');
    }
    const session = await this.gateway.createBillingPortalSession(customerId);
    return new BillingPortalResponseDTO({ url: session.url });
  }

  async findByUser(userId: string): Promise<SubscriptionResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));
    return rows.map((row) => new SubscriptionResponseDTO(row));
  }

  async findActive(
    userId: string,
  ): Promise<ActiveSubscriptionResponseDTO | null> {
    const [row] = await this.db
      .select({ subscription: subscriptions, plan: plans })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(this.activeWhere(userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    if (!row) return null;
    const resolvedPlan = await this.planService.findOne(row.plan.id);
    return new ActiveSubscriptionResponseDTO({
      subscription: new SubscriptionResponseDTO(row.subscription),
      plan: resolvedPlan,
    });
  }

  async check(userId: string): Promise<SubscriptionCheckResponseDTO> {
    const active = await this.findActive(userId);
    return new SubscriptionCheckResponseDTO({
      subscribed: !!active,
      subscription: active?.subscription ?? null,
      plan: active?.plan ?? null,
    });
  }

  async cancel(
    userId: string,
    id: string,
  ): Promise<CancelSubscriptionResponseDTO> {
    const [owned] = await this.db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)))
      .limit(1);
    if (!owned) throw new RpcNotFoundException('Subscription not found');
    if (!owned.providerSubscriptionId) {
      throw new RpcBadRequestException(
        'Subscription is not connected to Stripe',
      );
    }

    const stripeSubscription = await this.gateway.cancelAtPeriodEnd(
      owned.providerSubscriptionId,
    );
    const periodEnd = this.periodEnd(stripeSubscription);
    const [cancelled] = await this.db
      .update(subscriptions)
      .set({
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        status: stripeSubscription.status,
        currentPeriodEnd: periodEnd,
        expiresAt: periodEnd,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, owned.id))
      .returning();

    this.logger.log(`Subscription scheduled for cancellation: ${id}`);
    return new CancelSubscriptionResponseDTO({
      message: 'Subscription will cancel at the end of the billing period',
      id,
      subscription: new SubscriptionResponseDTO(cancelled),
    });
  }

  private activeWhere(userId: string) {
    const now = new Date();
    return and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.active, true),
      or(isNull(subscriptions.startsAt), lte(subscriptions.startsAt, now)),
      or(
        gt(subscriptions.graceEndsAt, now),
        isNull(subscriptions.expiresAt),
        gt(subscriptions.expiresAt, now),
      ),
    );
  }

  private async findStripeCustomerId(
    userId: string,
  ): Promise<string | undefined> {
    const [row] = await this.db
      .select({ customerId: subscriptions.providerCustomerId })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.provider, 'stripe'),
          isNotNull(subscriptions.providerCustomerId),
        ),
      )
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return row?.customerId ?? undefined;
  }

  private async hasOpenStripeSubscription(userId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.provider, 'stripe'),
          isNotNull(subscriptions.providerSubscriptionId),
          notInArray(subscriptions.status, [
            'canceled',
            'incomplete_expired',
            'unpaid',
          ]),
        ),
      )
      .limit(1);
    return !!row;
  }

  private periodEnd(subscription: {
    items: { data: Array<{ current_period_end: number }> };
  }): Date | null {
    const timestamps = subscription.items.data.map(
      (item) => item.current_period_end,
    );
    return timestamps.length ? new Date(Math.max(...timestamps) * 1000) : null;
  }
}
