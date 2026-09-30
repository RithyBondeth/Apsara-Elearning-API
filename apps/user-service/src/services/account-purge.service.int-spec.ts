import { eq } from 'drizzle-orm';
import { of, throwError } from 'rxjs';
import { user } from '@app/database/schemas/user/user.schema';
import { payments } from '@app/database/schemas/payment/payment.schema';
import { subscriptions } from '@app/database/schemas/subscription/subscription.schema';
import {
  createPlan,
  createUser,
  days,
  openTestDb,
  resetDb,
} from '../../../../test/db/test-db';
import { AccountPurgeService } from './account-purge.service';

/**
 * The deletion purge against real foreign keys: only accounts past the grace
 * period go, everything of theirs cascades — except payment records, which
 * must survive unlinked (payments.user_id ON DELETE SET NULL).
 */
const { sql, db } = openTestDb();
afterAll(() => sql.end({ timeout: 1 }));

const renewalsStopped = () => ({ send: jest.fn(() => of({ stopped: 0 })) });

describe('AccountPurgeService.purgeDue', () => {
  it('deletes only overdue accounts and keeps their payments, unlinked', async () => {
    await resetDb(sql);
    const due = await createUser(db, { deletionRequestedAt: days(-8) });
    const notYet = await createUser(db, { deletionRequestedAt: days(-2) });
    const active = await createUser(db);
    const plan = await createPlan(db);
    const [sub] = await db
      .insert(subscriptions)
      .values({ userId: due.id, planId: plan.id, status: 'canceled' })
      .returning();
    await db.insert(payments).values({
      userId: due.id,
      subscriptionId: sub.id,
      amount: '5.00',
      currency: 'USD',
      provider: 'stripe',
      transactionId: 'in_int_1',
      status: 'succeeded',
    });

    const client = renewalsStopped();
    const res = await new AccountPurgeService(
      db as never,
      client as never,
    ).purgeDue();

    expect(res).toEqual({ purged: 1, skipped: 0 });
    expect(client.send).toHaveBeenCalledWith(expect.anything(), {
      userId: due.id,
    });
    const left = (await db.select({ id: user.id }).from(user)).map((r) => r.id);
    expect(left.sort()).toEqual([notYet.id, active.id].sort());

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.transactionId, 'in_int_1'));
    expect(payment).toMatchObject({
      userId: null,
      subscriptionId: null,
      amount: '5.00',
    });
    expect(
      await db.select().from(subscriptions).where(eq(subscriptions.id, sub.id)),
    ).toHaveLength(0);
  });

  it("keeps an account whose renewals couldn't be confirmed stopped", async () => {
    await resetDb(sql);
    const due = await createUser(db, { deletionRequestedAt: days(-8) });
    const client = {
      send: jest.fn(() =>
        throwError(() => new Error('subscription-service down')),
      ),
    };
    const res = await new AccountPurgeService(
      db as never,
      client as never,
    ).purgeDue();

    expect(res).toEqual({ purged: 0, skipped: 1 });
    expect(
      await db.select().from(user).where(eq(user.id, due.id)),
    ).toHaveLength(1);
  });
});
