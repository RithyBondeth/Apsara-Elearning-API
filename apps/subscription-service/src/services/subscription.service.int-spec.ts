import { subscriptions } from '@app/database/schemas/subscription/subscription.schema';
import {
  createPlan,
  createUser,
  openTestDb,
  resetDb,
} from '../../../../test/db/test-db';
import type { PaymentProviderRegistry } from '../payment/payment-provider.registry';
import type { PlanService } from './plan.service';
import { SubscriptionService } from './subscription.service';

/**
 * Which subscriptions account deletion stops: exactly those that can still
 * charge. Missing one means billing a deleted account; the status filter is
 * SQL, so it's checked against real rows.
 */
const { sql, db } = openTestDb();
afterAll(() => sql.end({ timeout: 1 }));

describe('SubscriptionService.stopRenewals', () => {
  it('stops every still-billing subscription once, and nothing else', async () => {
    await resetDb(sql);
    const u = await createUser(db);
    const other = await createUser(db);
    const plan = await createPlan(db);
    const rows: [string, string, boolean, string | null][] = [
      [u.id, 'active', false, 'sub_active'],
      [u.id, 'trialing', false, 'sub_trialing'],
      [u.id, 'past_due', false, 'sub_past_due'],
      [u.id, 'unpaid', false, 'sub_unpaid'],
      [u.id, 'incomplete', false, 'sub_incomplete'],
      [u.id, 'canceled', false, 'sub_canceled'],
      [u.id, 'active', true, 'sub_already_ending'],
      [u.id, 'active', false, null], // not provider-billed
      [other.id, 'active', false, 'sub_someone_else'],
    ];
    for (const [userId, status, cancelAtPeriodEnd, ref] of rows) {
      await db.insert(subscriptions).values({
        userId,
        planId: plan.id,
        status,
        cancelAtPeriodEnd,
        providerSubscriptionId: ref,
      });
    }

    const cancelAtPeriodEnd = jest.fn().mockResolvedValue({
      cancelAtPeriodEnd: true,
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 86_400_000),
    });
    const registry = {
      active: () => ({ cancelAtPeriodEnd }),
    } as unknown as PaymentProviderRegistry;
    const service = new SubscriptionService(
      db as never,
      {} as PlanService,
      registry,
    );

    await expect(service.stopRenewals(u.id)).resolves.toEqual({ stopped: 4 });
    expect(
      cancelAtPeriodEnd.mock.calls.map((c: string[]) => c[0]).sort(),
    ).toEqual(['sub_active', 'sub_past_due', 'sub_trialing', 'sub_unpaid']);
    // Idempotent: the stopped ones are now marked, so a retry finds nothing.
    await expect(service.stopRenewals(u.id)).resolves.toEqual({ stopped: 0 });
  });
});
