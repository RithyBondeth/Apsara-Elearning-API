import { eq } from 'drizzle-orm';
import { Observable, of } from 'rxjs';
import { payments } from '@app/database/schemas/payment/payment.schema';
import { paymentRefunds } from '@app/database/schemas/payment/payment-refund.schema';
import { subscriptions } from '@app/database/schemas/subscription/subscription.schema';
import {
  createPlan,
  createUser,
  days,
  openTestDb,
  resetDb,
} from '../../../../test/db/test-db';
import type {
  IRefundInput,
  IRefundResult,
} from '../payment/payment-provider.interface';
import { PaymentAdminService } from './payment-admin.service';
import { PaymentService } from './payment.service';

/**
 * Admin refunds against real rows, with the payment provider faked: the
 * remaining-amount arithmetic, the ledger, idempotency keys, and when a full
 * refund ends the subscription at the provider.
 */
const { sql, db } = openTestDb();

const refunds: IRefundInput[] = [];
const cancelled: string[] = [];
let nextStatus = 'succeeded';
const provider = {
  id: 'stripe',
  refund: jest.fn((input: IRefundInput): Promise<IRefundResult> => {
    refunds.push(input);
    return Promise.resolve({
      reference: `re_${refunds.length}`,
      status: nextStatus,
      amountMinor: input.amountMinor,
      currency: 'USD',
      reason: 'requested_by_customer',
      failureReason: null,
    });
  }),
  cancelNow: jest.fn((id: string) => {
    cancelled.push(id);
    return Promise.resolve({
      status: 'canceled',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
    });
  }),
};
const userClient = {
  send: jest.fn<Observable<unknown>, [pattern: string, payload: unknown]>(() =>
    of({}),
  ),
};
const service = new PaymentAdminService(
  db as never,
  new PaymentService(db as never, {} as never),
  { active: () => provider } as never,
  userClient as never,
);

let admin: string;
let learner: string;
let subscriptionId: string;

async function pay(over: Partial<typeof payments.$inferInsert> = {}) {
  const [row] = await db
    .insert(payments)
    .values({
      userId: learner,
      subscriptionId,
      amount: '9.99',
      currency: 'usd',
      provider: 'stripe',
      status: 'succeeded',
      providerPaymentIntentId: `pi_${Math.random()}`,
      createdAt: days(-1),
      ...over,
    })
    .returning();
  return row.id;
}

afterAll(() => sql.end({ timeout: 1 }));

beforeEach(async () => {
  await resetDb(sql);
  refunds.length = 0;
  cancelled.length = 0;
  nextStatus = 'succeeded';
  jest.clearAllMocks();
  admin = (await createUser(db, { isAdmin: true, firstName: 'Ops' })).id;
  learner = (await createUser(db)).id;
  const plan = await createPlan(db);
  const [sub] = await db
    .insert(subscriptions)
    .values({
      userId: learner,
      planId: plan.id,
      status: 'active',
      active: true,
      providerSubscriptionId: 'sub_123',
      currentPeriodStart: days(-2),
      currentPeriodEnd: days(28),
    })
    .returning();
  subscriptionId = sub.id;
});

describe('PaymentAdminService.refund', () => {
  it('refunds everything by default, ends the subscription and tells the learner', async () => {
    const id = await pay();

    const res = await service.refund(admin, id, {
      reason: 'Charged twice by mistake',
    });

    expect(refunds[0]).toMatchObject({
      amountMinor: 999,
      idempotencyKey: `admin-refund:${id}:0:999`,
    });
    expect(res.subscriptionCanceled).toBe(true);
    expect(cancelled).toEqual(['sub_123']);
    expect(res.payment).toMatchObject({
      refundedAmount: 9.99,
      refundStatus: 'refunded',
    });
    expect(res.payment.refunds[0]).toMatchObject({
      amount: 9.99,
      note: 'Charged twice by mistake',
      requestedByName: 'Ops',
    });
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId));
    expect(sub).toMatchObject({ status: 'canceled', active: false });
    const [[pattern, notification]] = userClient.send.mock.calls;
    expect(pattern).toBe('user.notification.create');
    expect(notification).toMatchObject({
      userId: learner,
      title: 'Refund issued',
    });
  });

  it('a partial refund keeps the subscription, and later refunds see what is left', async () => {
    const id = await pay();

    const first = await service.refund(admin, id, {
      amount: 4,
      reason: 'Goodwill credit',
    });
    expect(first.subscriptionCanceled).toBe(false);
    expect(first.payment.refundStatus).toBe('partially_refunded');

    await expect(
      service.refund(admin, id, { amount: 6, reason: 'Too much' }),
    ).rejects.toMatchObject({ error: { statusCode: 400 } });

    const rest = await service.refund(admin, id, { reason: 'The rest' });
    expect(refunds[1]).toMatchObject({
      amountMinor: 599,
      idempotencyKey: `admin-refund:${id}:400:599`,
    });
    // Refunding the remainder is a full refund: now the subscription ends.
    expect(rest.subscriptionCanceled).toBe(true);
    expect(rest.payment.refundStatus).toBe('refunded');
  });

  it('counts a refund still settling, so it cannot be refunded twice', async () => {
    const id = await pay();
    nextStatus = 'pending';
    await service.refund(admin, id, { reason: 'Bank refund pending' });

    await expect(
      service.refund(admin, id, { reason: 'Again' }),
    ).rejects.toMatchObject({ error: { statusCode: 400 } });
    expect(refunds).toHaveLength(1);
  });

  it('does not cut off a newer paid period when refunding an old invoice', async () => {
    const old = await pay({ createdAt: days(-40) });

    const res = await service.refund(admin, old, {
      reason: 'Old duplicate charge',
    });

    expect(res.payment.refundStatus).toBe('refunded');
    expect(res.subscriptionCanceled).toBe(false);
    expect(cancelled).toEqual([]);
  });

  it('refuses failed payments, manual payments and unknown ids', async () => {
    const failed = await pay({ status: 'failed' });
    const manual = await pay({ provider: 'manual' });

    for (const id of [failed, manual]) {
      await expect(
        service.refund(admin, id, { reason: 'Should not go' }),
      ).rejects.toMatchObject({ error: { statusCode: 400 } });
    }
    await expect(
      service.refund(admin, '00000000-0000-0000-0000-000000000000', {
        reason: 'Nothing here',
      }),
    ).rejects.toMatchObject({ error: { statusCode: 404 } });
    expect(refunds).toHaveLength(0);
  });

  it("keeps who asked when Stripe's webhook later reports the same refund", async () => {
    const id = await pay();
    await service.refund(admin, id, { amount: 1, reason: 'Late delivery' });
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id));

    // The webhook echo: same refund id, no requester or note.
    await new PaymentService(db as never, {} as never).recordRefund(payment, {
      providerRefundId: 're_1',
      amount: 1,
      currency: 'usd',
      status: 'succeeded',
    });

    const [row] = await db
      .select()
      .from(paymentRefunds)
      .where(eq(paymentRefunds.providerRefundId, 're_1'));
    expect(row).toMatchObject({ requestedBy: admin, note: 'Late delivery' });
  });
});
