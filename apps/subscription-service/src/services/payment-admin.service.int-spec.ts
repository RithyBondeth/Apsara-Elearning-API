import { eq } from 'drizzle-orm';
import { payments } from '@app/database/schemas/payment/payment.schema';
import { paymentRefunds } from '@app/database/schemas/payment/payment-refund.schema';
import { subscriptions } from '@app/database/schemas/subscription/subscription.schema';
import { user } from '@app/database/schemas/user/user.schema';
import {
  createPlan,
  createUser,
  openTestDb,
  resetDb,
} from '../../../../test/db/test-db';
import { PaymentAdminService } from './payment-admin.service';

/**
 * The admin payment history: joins to learner and plan (either may be gone),
 * status/refund filters and search — all SQL, so run against real rows.
 */
const { sql, db } = openTestDb();
const service = new PaymentAdminService(db as never);
afterAll(() => sql.end({ timeout: 1 }));

const ids: Record<string, string> = {};

async function pay(
  userId: string | null,
  over: Partial<typeof payments.$inferInsert> = {},
) {
  const [row] = await db
    .insert(payments)
    .values({
      userId,
      amount: '5.00',
      currency: 'usd',
      provider: 'stripe',
      status: 'succeeded',
      ...over,
    })
    .returning();
  return row.id;
}

beforeAll(async () => {
  await resetDb(sql);
  const dara = await createUser(db, {
    firstName: 'Sok',
    lastName: 'Dara',
    email: 'dara@int.test',
  });
  const bopha = await createUser(db, { email: 'bopha@int.test' });
  const leaving = await createUser(db, { email: 'leaving@int.test' });
  const plan = await createPlan(db, { name: 'Premium Monthly' });
  const [sub] = await db
    .insert(subscriptions)
    .values({ userId: dara.id, planId: plan.id, status: 'active' })
    .returning();
  ids.dara = dara.id;

  ids.paid = await pay(dara.id, {
    subscriptionId: sub.id,
    transactionId: 'in_100%_ok',
    createdAt: new Date('2026-09-01T00:00:00Z'),
  });
  ids.failed = await pay(bopha.id, {
    status: 'failed',
    transactionId: 'in_failed',
    createdAt: new Date('2026-09-02T00:00:00Z'),
  });
  ids.refunded = await pay(dara.id, {
    transactionId: 'in_refunded',
    refundedAmount: '2.00',
    refundStatus: 'partially_refunded',
    createdAt: new Date('2026-09-03T00:00:00Z'),
  });
  await db.insert(paymentRefunds).values({
    paymentId: ids.refunded,
    providerRefundId: 're_1',
    amount: '2.00',
    currency: 'usd',
    status: 'succeeded',
    reason: 'requested_by_customer',
  });
  ids.orphan = await pay(leaving.id, {
    transactionId: 'in_orphan',
    createdAt: new Date('2026-09-04T00:00:00Z'),
  });
  // The account is deleted; its payment stays, unlinked.
  await db.delete(user).where(eq(user.id, leaving.id));
});

const idsOf = async (query: Parameters<PaymentAdminService['list']>[0]) =>
  (await service.list(query)).map((p) => p.id);

describe('PaymentAdminService.list', () => {
  it('lists newest first with learner and plan', async () => {
    const rows = await service.list();
    expect(rows.map((p) => p.id)).toEqual([
      ids.orphan,
      ids.refunded,
      ids.failed,
      ids.paid,
    ]);
    expect(rows.find((p) => p.id === ids.paid)).toMatchObject({
      learnerName: 'Sok Dara',
      learnerEmail: 'dara@int.test',
      planName: 'Premium Monthly',
      amount: 5,
      currency: 'USD',
    });
  });

  it("keeps a deleted account's payment, with no learner", async () => {
    const orphan = (await service.list()).find((p) => p.id === ids.orphan);
    expect(orphan).toMatchObject({
      userId: null,
      learnerName: null,
      learnerEmail: null,
    });
  });

  it('filters by status and by refunds (partial included)', async () => {
    expect(await idsOf({ filter: 'failed' })).toEqual([ids.failed]);
    expect(await idsOf({ filter: 'refunded' })).toEqual([ids.refunded]);
    expect((await idsOf({ filter: 'succeeded' })).sort()).toEqual(
      [ids.paid, ids.refunded, ids.orphan].sort(),
    );
  });

  it('searches name, email and transaction id; % is literal', async () => {
    expect((await idsOf({ q: 'sok dara' })).sort()).toEqual(
      [ids.paid, ids.refunded].sort(),
    );
    expect(await idsOf({ q: 'bopha@' })).toEqual([ids.failed]);
    expect(await idsOf({ q: 'in_orphan' })).toEqual([ids.orphan]);
    expect(await idsOf({ q: '100%' })).toEqual([ids.paid]);
  });

  it("scopes to one learner's payments", async () => {
    expect((await idsOf({ userId: ids.dara })).sort()).toEqual(
      [ids.paid, ids.refunded].sort(),
    );
  });
});

describe('PaymentAdminService.findOne', () => {
  it('returns the payment with its refunds', async () => {
    const detail = await service.findOne(ids.refunded);
    expect(detail).toMatchObject({
      refundStatus: 'partially_refunded',
      refundedAmount: 2,
    });
    expect(detail.refunds).toEqual([
      expect.objectContaining({
        amount: 2,
        status: 'succeeded',
        reason: 'requested_by_customer',
        providerRefundId: 're_1',
      }),
    ]);
  });

  it('throws 404 for an unknown payment', async () => {
    await expect(
      service.findOne('00000000-0000-4000-8000-000000000000'),
    ).rejects.toMatchObject({ error: { statusCode: 404 } });
  });
});
