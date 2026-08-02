import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  and,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  lte,
  or,
  sql,
} from 'drizzle-orm';
import Stripe from 'stripe';
import { payments } from '@app/database/schemas/payment/payment.schema';
import { stripeWebhookEvents } from '@app/database/schemas/payment/stripe-webhook-event.schema';
import { paymentRefunds } from '@app/database/schemas/payment/payment-refund.schema';
import { subscriptions } from '@app/database/schemas/subscription/subscription.schema';
import { plans } from '@app/database/schemas/subscription/plan.schema';
import {
  DRIZZLE,
  IPaymentService,
  PaymentResponseDTO,
  PaymentWebhookResponseDTO,
  RecordPaymentInput,
} from '@app/contracts';
import {
  RpcConflictException,
  RpcInternalException,
  RpcNotFoundException,
} from '@app/common';
import { PaymentGatewayService } from '../payment/payment-gateway.service';

@Injectable()
export class PaymentService implements IPaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    private readonly gateway: PaymentGatewayService,
  ) {}

  async record(input: RecordPaymentInput): Promise<PaymentResponseDTO> {
    const [saved] = await this.db
      .insert(payments)
      .values({
        userId: input.userId,
        subscriptionId: input.subscriptionId ?? null,
        amount: input.amount,
        currency: input.currency,
        provider: input.provider,
        transactionId: input.transactionId,
        providerInvoiceId: input.providerInvoiceId,
        providerPaymentIntentId: input.providerPaymentIntentId,
        providerChargeId: input.providerChargeId,
        status: input.status,
      })
      .onConflictDoUpdate({
        target: payments.transactionId,
        set: {
          subscriptionId: input.subscriptionId ?? null,
          amount: input.amount,
          currency: input.currency,
          providerInvoiceId: input.providerInvoiceId,
          providerPaymentIntentId: input.providerPaymentIntentId,
          providerChargeId: input.providerChargeId,
          status: input.status,
          updatedAt: new Date(),
        },
      })
      .returning();
    return this.toDTO(saved);
  }

  async findByUser(userId: string): Promise<PaymentResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(payments.createdAt);
    return rows.map((row) => this.toDTO(row));
  }

  async findOne(id: string): Promise<PaymentResponseDTO> {
    const [found] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Payment not found');
    return this.toDTO(found);
  }

  async webhook(payload: {
    rawBody: string;
    signature: string;
  }): Promise<PaymentWebhookResponseDTO> {
    const event = this.gateway.constructWebhookEvent(
      Buffer.from(payload.rawBody, 'base64'),
      payload.signature,
    );
    if (!(await this.claimEvent(event))) {
      return new PaymentWebhookResponseDTO({ handled: true });
    }

    try {
      await this.processEvent(event);
      await this.db
        .update(stripeWebhookEvents)
        .set({
          status: 'processed',
          processedAt: new Date(),
          lastError: null,
          updatedAt: new Date(),
        })
        .where(eq(stripeWebhookEvents.eventId, event.id));
    } catch (error) {
      await this.db
        .update(stripeWebhookEvents)
        .set({
          status: 'failed',
          lastError: this.errorMessage(error),
          updatedAt: new Date(),
        })
        .where(eq(stripeWebhookEvents.eventId, event.id));
      throw error;
    }

    this.logger.log(`Stripe webhook processed: ${event.type} (${event.id})`);
    return new PaymentWebhookResponseDTO({ handled: true });
  }

  private async processEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object;
        const subscriptionId = this.idOf(session.subscription);
        if (subscriptionId) {
          await this.syncSubscription(
            await this.gateway.retrieveSubscription(subscriptionId),
            session.metadata ?? undefined,
          );
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await this.syncSubscription(event.data.object);
        break;
      case 'invoice.paid':
        await this.handleInvoice(event.data.object, 'succeeded');
        break;
      case 'invoice.payment_failed':
        await this.handleInvoice(event.data.object, 'failed');
        break;
      case 'refund.created':
      case 'refund.updated':
      case 'refund.failed':
        await this.handleRefund(event.data.object);
        break;
      default:
        break;
    }
  }

  private async handleInvoice(
    invoice: Stripe.Invoice,
    status: 'succeeded' | 'failed',
  ): Promise<void> {
    const subscriptionId = this.idOf(
      invoice.parent?.subscription_details?.subscription,
    );
    if (!subscriptionId) return;

    const local = await this.syncSubscription(
      await this.gateway.retrieveSubscription(subscriptionId),
      invoice.parent?.subscription_details?.metadata ?? undefined,
    );
    const references = await this.gateway.invoicePaymentReferences(invoice.id);
    if (status === 'failed') {
      const [plan] = await this.db
        .select({ gracePeriodDays: plans.gracePeriodDays })
        .from(plans)
        .where(eq(plans.id, local.planId))
        .limit(1);
      const graceEndsAt = plan?.gracePeriodDays
        ? new Date(Date.now() + plan.gracePeriodDays * 86_400_000)
        : null;
      await this.db
        .update(subscriptions)
        .set({ active: !!graceEndsAt, graceEndsAt, updatedAt: new Date() })
        .where(eq(subscriptions.id, local.id));
    } else {
      await this.db
        .update(subscriptions)
        .set({ active: true, graceEndsAt: null, updatedAt: new Date() })
        .where(eq(subscriptions.id, local.id));
    }
    await this.record({
      userId: local.userId,
      subscriptionId: local.id,
      amount: (
        (status === 'succeeded' ? invoice.amount_paid : invoice.amount_due) /
        100
      ).toFixed(2),
      currency: invoice.currency.toUpperCase(),
      provider: 'stripe',
      transactionId: invoice.id,
      providerInvoiceId: invoice.id,
      providerPaymentIntentId: references.paymentIntentId,
      providerChargeId: references.chargeId,
      status,
    });
  }

  private async handleRefund(refund: Stripe.Refund): Promise<void> {
    const paymentIntentId = this.idOf(refund.payment_intent);
    const chargeId = this.idOf(refund.charge);
    const conditions = [
      ...(paymentIntentId
        ? [eq(payments.providerPaymentIntentId, paymentIntentId)]
        : []),
      ...(chargeId ? [eq(payments.providerChargeId, chargeId)] : []),
    ];
    let [payment] = conditions.length
      ? await this.db
          .select()
          .from(payments)
          .where(or(...conditions))
          .limit(1)
      : [];

    // Backfill compatibility for invoices recorded before provider payment IDs
    // were persisted: Stripe can resolve a PaymentIntent back to its invoice.
    if (!payment && paymentIntentId) {
      const invoiceId =
        await this.gateway.invoiceIdForPaymentIntent(paymentIntentId);
      if (invoiceId) {
        [payment] = await this.db
          .select()
          .from(payments)
          .where(
            or(
              eq(payments.providerInvoiceId, invoiceId),
              eq(payments.transactionId, invoiceId),
            ),
          )
          .limit(1);
      }
    }
    if (!payment) {
      throw new RpcInternalException(
        `Cannot reconcile Stripe refund ${refund.id} to a payment`,
      );
    }

    await this.db
      .insert(paymentRefunds)
      .values({
        paymentId: payment.id,
        providerRefundId: refund.id,
        amount: (refund.amount / 100).toFixed(2),
        currency: refund.currency.toUpperCase(),
        status: refund.status ?? 'unknown',
        reason: refund.reason,
        failureReason: refund.failure_reason,
      })
      .onConflictDoUpdate({
        target: paymentRefunds.providerRefundId,
        set: {
          status: refund.status ?? 'unknown',
          reason: refund.reason,
          failureReason: refund.failure_reason,
          updatedAt: new Date(),
        },
      });

    const successful = await this.db
      .select({ amount: paymentRefunds.amount })
      .from(paymentRefunds)
      .where(
        and(
          eq(paymentRefunds.paymentId, payment.id),
          inArray(paymentRefunds.status, ['succeeded']),
        ),
      );
    const refundedAmount = successful.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    const paidAmount = Number(payment.amount ?? 0);
    const refundStatus =
      refundedAmount >= paidAmount && paidAmount > 0
        ? 'refunded'
        : refundedAmount > 0
          ? 'partially_refunded'
          : (refund.status ?? 'unknown');

    await this.db
      .update(payments)
      .set({
        refundedAmount: refundedAmount.toFixed(2),
        refundStatus,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    if (
      refundStatus === 'refunded' &&
      payment.subscriptionId &&
      payment.createdAt
    ) {
      // A historical refund must not revoke a newer paid renewal period.
      await this.db
        .update(subscriptions)
        .set({ active: false, updatedAt: new Date() })
        .where(
          and(
            eq(subscriptions.id, payment.subscriptionId),
            or(
              isNull(subscriptions.currentPeriodStart),
              lte(subscriptions.currentPeriodStart, payment.createdAt),
            ),
          ),
        );
    }
  }

  private async claimEvent(event: Stripe.Event): Promise<boolean> {
    const now = new Date();
    const [created] = await this.db
      .insert(stripeWebhookEvents)
      .values({
        eventId: event.id,
        eventType: event.type,
        livemode: event.livemode,
        status: 'processing',
        attempts: 1,
        receivedAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing()
      .returning({ eventId: stripeWebhookEvents.eventId });
    if (created) return true;

    const [existing] = await this.db
      .select({ status: stripeWebhookEvents.status })
      .from(stripeWebhookEvents)
      .where(eq(stripeWebhookEvents.eventId, event.id))
      .limit(1);
    if (existing?.status === 'processed') return false;

    const staleBefore = new Date(Date.now() - 5 * 60_000);
    const [claimed] = await this.db
      .update(stripeWebhookEvents)
      .set({
        status: 'processing',
        attempts: sql`${stripeWebhookEvents.attempts} + 1`,
        lastError: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(stripeWebhookEvents.eventId, event.id),
          or(
            eq(stripeWebhookEvents.status, 'failed'),
            and(
              eq(stripeWebhookEvents.status, 'processing'),
              lt(stripeWebhookEvents.updatedAt, staleBefore),
            ),
          ),
        ),
      )
      .returning({ eventId: stripeWebhookEvents.eventId });
    if (claimed) return true;

    // A concurrent worker owns this event. A non-2xx response asks Stripe to
    // retry instead of acknowledging work that has not completed yet.
    throw new RpcConflictException('Stripe event is already being processed');
  }

  private errorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return message.slice(0, 2000);
  }

  private async syncSubscription(
    stripeSubscription: Stripe.Subscription,
    fallbackMetadata?: Stripe.Metadata,
  ): Promise<typeof subscriptions.$inferSelect> {
    const [existing] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.providerSubscriptionId, stripeSubscription.id))
      .limit(1);

    const metadata = {
      ...fallbackMetadata,
      ...stripeSubscription.metadata,
    };
    const priceId = stripeSubscription.items.data[0]?.price.id;
    const [mappedPlan] = priceId
      ? await this.db
          .select({ id: plans.id })
          .from(plans)
          .where(eq(plans.stripePriceId, priceId))
          .limit(1)
      : [];
    const userId = existing?.userId ?? metadata.userId;
    // Prefer the current Stripe Price mapping so portal plan changes update
    // local entitlements even when the original metadata stays unchanged.
    const planId = mappedPlan?.id ?? existing?.planId ?? metadata.planId;
    if (!userId || !planId) {
      throw new RpcInternalException(
        `Cannot map Stripe subscription ${stripeSubscription.id} to a user and plan`,
      );
    }

    const periodStart = this.periodBoundary(stripeSubscription, 'start');
    const periodEnd = this.periodBoundary(stripeSubscription, 'end');
    const retainedGrace =
      !['active', 'trialing'].includes(stripeSubscription.status) &&
      existing?.graceEndsAt &&
      existing.graceEndsAt > new Date()
        ? existing.graceEndsAt
        : null;
    let active =
      ['active', 'trialing'].includes(stripeSubscription.status) &&
      (!periodEnd || periodEnd > new Date());
    active ||= !!retainedGrace;

    if (active && existing && periodStart) {
      const [latestPayment] = await this.db
        .select({ refundStatus: payments.refundStatus })
        .from(payments)
        .where(
          and(
            eq(payments.subscriptionId, existing.id),
            eq(payments.status, 'succeeded'),
            gte(payments.createdAt, periodStart),
          ),
        )
        .orderBy(desc(payments.createdAt))
        .limit(1);
      if (latestPayment?.refundStatus === 'refunded') active = false;
    }

    if (active) {
      await this.db
        .update(subscriptions)
        .set({ active: false, updatedAt: new Date() })
        .where(
          and(eq(subscriptions.userId, userId), eq(subscriptions.active, true)),
        );
    }

    const values = {
      userId,
      planId,
      startsAt: periodStart,
      expiresAt: periodEnd,
      active,
      provider: 'stripe',
      status: stripeSubscription.status,
      providerCustomerId: this.idOf(stripeSubscription.customer),
      providerSubscriptionId: stripeSubscription.id,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      trialEndsAt: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
      graceEndsAt: retainedGrace,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      updatedAt: new Date(),
    };
    const [saved] = await this.db
      .insert(subscriptions)
      .values(values)
      .onConflictDoUpdate({
        target: subscriptions.providerSubscriptionId,
        set: values,
      })
      .returning();
    return saved;
  }

  private periodBoundary(
    subscription: Stripe.Subscription,
    boundary: 'start' | 'end',
  ): Date | null {
    const values = subscription.items.data.map((item) =>
      boundary === 'start'
        ? item.current_period_start
        : item.current_period_end,
    );
    if (!values.length) return null;
    const seconds =
      boundary === 'start' ? Math.min(...values) : Math.max(...values);
    return new Date(seconds * 1000);
  }

  private idOf(value: { id: string } | string | null | undefined) {
    return typeof value === 'string' ? value : value?.id;
  }

  private toDTO(row: typeof payments.$inferSelect): PaymentResponseDTO {
    return new PaymentResponseDTO({
      ...row,
      amount: Number(row.amount),
      refundedAmount: Number(row.refundedAmount),
    });
  }
}
