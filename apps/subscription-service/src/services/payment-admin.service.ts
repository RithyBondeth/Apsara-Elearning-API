import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, desc, eq, ilike, isNotNull, or, SQL, sql } from 'drizzle-orm';
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
  DRIZZLE,
} from '@app/contracts';
import { RpcNotFoundException } from '@app/common';

/** A search tool, not an export: cap what one query returns. */
const LIST_LIMIT = 200;

/**
 * Read-only payment history for the admin console, so "did this learner pay?"
 * and "was it refunded?" don't need the Stripe dashboard. Payments and refunds
 * are written by the Stripe webhook (PaymentService); nothing here changes
 * them. A payment whose account was deleted keeps its row with no user.
 */
@Injectable()
export class PaymentAdminService {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

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
      .select()
      .from(paymentRefunds)
      .where(eq(paymentRefunds.paymentId, id))
      .orderBy(desc(paymentRefunds.createdAt));

    return new AdminPaymentDetailDTO({
      ...this.toDTO(row),
      refunds: refunds.map(
        (r) =>
          new AdminPaymentRefundDTO({
            id: r.id,
            amount: Number(r.amount),
            currency: r.currency,
            status: r.status,
            reason: r.reason,
            failureReason: r.failureReason,
            providerRefundId: r.providerRefundId,
            createdAt: r.createdAt,
          }),
      ),
    });
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
