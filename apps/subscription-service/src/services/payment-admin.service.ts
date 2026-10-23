import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { alias } from 'drizzle-orm/pg-core';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  and,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  or,
  SQL,
  sql,
} from 'drizzle-orm';
import { payments } from '@app/database/schemas/payment/payment.schema';
import { paymentRefunds } from '@app/database/schemas/payment/payment-refund.schema';
import { subscriptions } from '@app/database/schemas/subscription/subscription.schema';
import { plans } from '@app/database/schemas/subscription/plan.schema';
import { user } from '@app/database/schemas/user/user.schema';
import {
  AdminPaymentDetailDTO,
  AdminPaymentDTO,
  AdminPaymentQueryDTO,
  AdminPaymentRefundDTO,
  AdminRefundRequestDTO,
  AdminRefundResponseDTO,
  DRIZZLE,
  USER_SERVICE,
} from '@app/contracts';
import {
  notifyUser,
  RpcBadRequestException,
  RpcNotFoundException,
} from '@app/common';
import { PaymentProviderRegistry } from '../payment/payment-provider.registry';
import { PaymentService } from './payment.service';

/** A search tool, not an export: cap what one query returns. */
const LIST_LIMIT = 200;

/** Refunds that already claim part of a payment, settled or still settling. */
const COMMITTED_REFUND_STATUSES = ['succeeded', 'pending', 'requires_action'];

const requester = alias(user, 'refund_requester');

/**
 * Payment history for the admin console, so "did this learner pay?" and "was
 * it refunded?" don't need the Stripe dashboard — and refunds, issued here
 * through the payment provider. Payment rows themselves are written by the
 * Stripe webhook (PaymentService). A payment whose account was deleted keeps
 * its row with no user.
 */
@Injectable()
export class PaymentAdminService {
  private readonly logger = new Logger(PaymentAdminService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    private readonly payments: PaymentService,
    private readonly providers: PaymentProviderRegistry,
    @Inject(USER_SERVICE.NAME) private readonly userClient: ClientProxy,
  ) {}

  async list(query: AdminPaymentQueryDTO = {}): Promise<AdminPaymentDTO[]> {
    const conditions: SQL[] = [];
    if (query.userId) conditions.push(eq(payments.userId, query.userId));
    if (query.filter === 'succeeded') {
      conditions.push(eq(payments.status, 'succeeded'));
    } else if (query.filter === 'failed') {
      conditions.push(eq(payments.status, 'failed'));
    } else if (query.filter === 'refunded') {
      conditions.push(isNotNull(payments.refundStatus));
    }
    const term = query.q?.trim();
    if (term) {
      const like = `%${term.replace(/[%_\\]/g, '\\$&')}%`;
      conditions.push(
        or(
          ilike(user.email, like),
          ilike(sql`concat_ws(' ', ${user.firstName}, ${user.lastName})`, like),
          ilike(payments.transactionId, like),
          ilike(payments.providerInvoiceId, like),
        )!,
      );
    }

    const rows = await this.select()
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(payments.createdAt))
      .limit(LIST_LIMIT);
    return rows.map((row) => this.toDTO(row));
  }

  async findOne(id: string): Promise<AdminPaymentDetailDTO> {
    const [row] = await this.select().where(eq(payments.id, id)).limit(1);
    if (!row) throw new RpcNotFoundException('Payment not found');

    const refunds = await this.db
      .select({
        refund: paymentRefunds,
        requesterFirst: requester.firstName,
        requesterLast: requester.lastName,
        requesterEmail: requester.email,
      })
      .from(paymentRefunds)
      .leftJoin(requester, eq(paymentRefunds.requestedBy, requester.id))
      .where(eq(paymentRefunds.paymentId, id))
      .orderBy(desc(paymentRefunds.createdAt));

    return new AdminPaymentDetailDTO({
      ...this.toDTO(row),
      refunds: refunds.map(
        ({ refund: r, requesterFirst, requesterLast, requesterEmail }) =>
          new AdminPaymentRefundDTO({
            id: r.id,
            amount: Number(r.amount),
            currency: r.currency,
            status: r.status,
            reason: r.reason,
            failureReason: r.failureReason,
            providerRefundId: r.providerRefundId,
            note: r.note,
            requestedByName: requesterEmail
              ? [requesterFirst, requesterLast].filter(Boolean).join(' ') ||
                requesterEmail
              : null,
            createdAt: r.createdAt,
          }),
      ),
    });
  }

  /**
   * Refunds part or all of a payment through its provider.
   *
   * The amount defaults to everything not yet refunded; refunds still settling
   * count as taken, so two quick refunds can't exceed what was paid. A full
   * refund of the payment that covers the current period also ends the
   * subscription at the provider straight away — only deactivating it locally
   * would leave the provider billing the learner again at renewal.
   */
  async refund(
    adminId: string,
    paymentId: string,
    { amount, reason }: AdminRefundRequestDTO,
  ): Promise<AdminRefundResponseDTO> {
    const [payment] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);
    if (!payment) throw new RpcNotFoundException('Payment not found');
    if (payment.status !== 'succeeded') {
      throw new RpcBadRequestException(
        'Only a successful payment can be refunded',
      );
    }
    const provider = this.providers.active();
    if (payment.provider !== provider.id) {
      throw new RpcBadRequestException(
        `This payment was not made through ${provider.id}, so it can't be refunded here`,
      );
    }

    const [{ committed }] = await this.db
      .select({
        committed: sql<string>`coalesce(sum(${paymentRefunds.amount}), 0)`,
      })
      .from(paymentRefunds)
      .where(
        and(
          eq(paymentRefunds.paymentId, paymentId),
          inArray(paymentRefunds.status, COMMITTED_REFUND_STATUSES),
        ),
      );
    const paidMinor = toMinor(Number(payment.amount ?? 0));
    const committedMinor = toMinor(Number(committed));
    const remainingMinor = paidMinor - committedMinor;
    const amountMinor = amount === undefined ? remainingMinor : toMinor(amount);
    if (remainingMinor <= 0) {
      throw new RpcBadRequestException(
        'This payment is already fully refunded',
      );
    }
    if (amountMinor <= 0 || amountMinor > remainingMinor) {
      throw new RpcBadRequestException(
        `Refund must be between 0.01 and ${(remainingMinor / 100).toFixed(2)}`,
      );
    }
    const note = reason.trim();

    const result = await provider.refund({
      paymentReference: payment.providerPaymentIntentId ?? undefined,
      chargeReference: payment.providerChargeId ?? undefined,
      invoiceReference:
        payment.providerInvoiceId ?? payment.transactionId ?? undefined,
      amountMinor,
      // Same payment, same amount, same refunds so far → same key, so a
      // double-click or a retry returns the first refund instead of a second.
      idempotencyKey: `admin-refund:${paymentId}:${committedMinor}:${amountMinor}`,
      metadata: { paymentId, adminId },
    });

    await this.payments.recordRefund(payment, {
      providerRefundId: result.reference,
      amount: result.amountMinor / 100,
      currency: result.currency,
      status: result.status,
      reason: result.reason,
      failureReason: result.failureReason,
      requestedBy: adminId,
      note,
    });

    const fullRefund = amountMinor === remainingMinor;
    const subscriptionCanceled =
      fullRefund && result.status !== 'failed'
        ? await this.cancelPaidSubscription(payment)
        : false;

    if (payment.userId && result.status !== 'failed') {
      const money = `${(result.amountMinor / 100).toFixed(2)} ${result.currency}`;
      await notifyUser(
        this.userClient,
        {
          userId: payment.userId,
          type: 'subscription_updated',
          title: 'Refund issued',
          body: subscriptionCanceled
            ? `${money} is on its way back to you, and your subscription has ended.`
            : `${money} is on its way back to you.`,
          data: { paymentId },
        },
        this.logger,
      );
    }

    this.logger.log(
      `Admin ${adminId} refunded ${amountMinor} of payment ${paymentId} (${result.status})${
        subscriptionCanceled ? '; subscription cancelled' : ''
      }`,
    );
    return new AdminRefundResponseDTO({
      payment: await this.findOne(paymentId),
      refundStatus: result.status,
      subscriptionCanceled,
    });
  }

  /**
   * Ends the subscription a fully refunded payment paid for — but only when
   * that payment covers the current period (the same rule the webhook uses):
   * refunding an old invoice must not cut off a newer, paid-for period.
   */
  private async cancelPaidSubscription(
    payment: typeof payments.$inferSelect,
  ): Promise<boolean> {
    if (!payment.subscriptionId || !payment.createdAt) return false;
    const [subscription] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, payment.subscriptionId))
      .limit(1);
    if (!subscription?.providerSubscriptionId) return false;
    if (subscription.status === 'canceled') return false;
    if (
      subscription.currentPeriodStart &&
      subscription.currentPeriodStart > payment.createdAt
    ) {
      return false;
    }

    const snapshot = await this.providers
      .active()
      .cancelNow(subscription.providerSubscriptionId);
    const now = new Date();
    await this.db
      .update(subscriptions)
      .set({
        status: snapshot.status,
        active: false,
        cancelAtPeriodEnd: false,
        expiresAt: now,
        graceEndsAt: null,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, subscription.id));
    return true;
  }

  /** A payment with who paid (if they still exist) and which plan it was for. */
  private select() {
    return this.db
      .select({
        payment: payments,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        planName: plans.name,
      })
      .from(payments)
      .leftJoin(user, eq(payments.userId, user.id))
      .leftJoin(subscriptions, eq(payments.subscriptionId, subscriptions.id))
      .leftJoin(plans, eq(subscriptions.planId, plans.id));
  }

  private toDTO(row: {
    payment: typeof payments.$inferSelect;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    planName: string | null;
  }): AdminPaymentDTO {
    const p = row.payment;
    return new AdminPaymentDTO({
      id: p.id,
      userId: p.userId,
      learnerName: row.email
        ? [row.firstName, row.lastName].filter(Boolean).join(' ') || row.email
        : null,
      learnerEmail: row.email,
      planName: row.planName,
      amount: Number(p.amount ?? 0),
      currency: (p.currency ?? '').toUpperCase(),
      provider: p.provider ?? '',
      status: p.status ?? '',
      refundedAmount: Number(p.refundedAmount),
      refundStatus: p.refundStatus,
      transactionId: p.transactionId,
      providerInvoiceId: p.providerInvoiceId,
      createdAt: p.createdAt,
    });
  }
}

/** Money in minor units (cents), rounded so 0.1 + 0.2 sums never drift. */
function toMinor(amount: number): number {
  return Math.round(amount * 100);
}
