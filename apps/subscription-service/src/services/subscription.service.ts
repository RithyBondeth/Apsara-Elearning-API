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
  SubscriptionCheckResponseDTO,
  SubscriptionResponseDTO,
} from '@app/contracts';
import {
  RpcBadRequestException,
  RpcConflictException,
  RpcNotFoundException,
} from '@app/common';
import { PaymentProviderRegistry } from '../payment/payment-provider.registry';
import { PlanService } from './plan.service';

@Injectable()
export class SubscriptionService implements ISubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    private readonly planService: PlanService,
    private readonly providers: PaymentProviderRegistry,
  ) {}

  async createCheckout(
    userId: string,
    planId: string,
  ): Promise<CheckoutSessionResponseDTO> {
    const provider = this.providers.active();
    if (await this.hasOpenSubscription(userId, provider.id)) {
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

    const customerId = await this.findCustomerId(userId, provider.id);
    const session = await provider.createCheckout({
      userId,
      planId,
      priceReference: plan.stripePriceId,
      customerReference: customerId,
      trialDays: plan.trialDays,
    });
    return new CheckoutSessionResponseDTO({
      sessionId: session.reference,
      url: session.url,
    });
  }

  async createBillingPortal(userId: string): Promise<BillingPortalResponseDTO> {
    const provider = this.providers.active();
    if (!provider.supportsBillingPortal) {
      // Local rails generally have no hosted portal; the caller should offer
      // in-app cancellation rather than a dead link.
      throw new RpcBadRequestException(
        `Provider '${provider.id}' has no hosted billing portal`,
      );
    }
    const customerId = await this.findCustomerId(userId, provider.id);
    if (!customerId) {
      throw new RpcNotFoundException('No billing account found');
    }
    const session = await provider.createBillingPortal(customerId);
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
        'Subscription is not connected to a payment provider',
      );
    }

    const snapshot = await this.providers
      .active()
      .cancelAtPeriodEnd(owned.providerSubscriptionId);
    const [cancelled] = await this.db
      .update(subscriptions)
      .set({
        cancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
        status: snapshot.status,
        currentPeriodEnd: snapshot.currentPeriodEnd,
        expiresAt: snapshot.currentPeriodEnd,
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

  /** The payer's customer record on a given rail, if we have opened one. */
  private async findCustomerId(
    userId: string,
    providerId: string,
  ): Promise<string | undefined> {
    const [row] = await this.db
      .select({ customerId: subscriptions.providerCustomerId })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.provider, providerId),
          isNotNull(subscriptions.providerCustomerId),
        ),
      )
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return row?.customerId ?? undefined;
  }

  /**
   * Scoped to the active rail, not hardcoded to Stripe: pinning this to one
   * provider would silently switch the guard off the moment a local rail is
   * selected, letting a learner open a second concurrent subscription.
   */
  private async hasOpenSubscription(
    userId: string,
    providerId: string,
  ): Promise<boolean> {
    const [row] = await this.db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.provider, providerId),
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
}
