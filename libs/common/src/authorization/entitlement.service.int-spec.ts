import { planEntitlements } from '@app/database/schemas/subscription/plan-entitlement.schema';
import { subscriptions } from '@app/database/schemas/subscription/subscription.schema';
import { userEntitlementGrants } from '@app/database/schemas/subscription/user-entitlement-grant.schema';
import {
  createPlan,
  createUser,
  days,
  openTestDb,
  resetDb,
} from '../../../../test/db/test-db';
import { EntitlementService } from './entitlement.service';

/**
 * The time windows that gate every premium feature. They live in SQL WHERE
 * clauses, which the unit spec's query mock can't evaluate — so the unit
 * tests cover precedence and these cover the windows.
 */
const { sql, db } = openTestDb();
const entitlements = new EntitlementService(db as never);

beforeAll(() => resetDb(sql));
afterAll(() => sql.end({ timeout: 1 }));

async function grant(
  userId: string,
  over: Partial<typeof userEntitlementGrants.$inferInsert> = {},
) {
  await db.insert(userEntitlementGrants).values({
    userId,
    entitlement: 'certificates',
    effect: 'allow',
    reason: 'integration test',
    ...over,
  });
}

async function subscribe(
  userId: string,
  over: Partial<typeof subscriptions.$inferInsert> = {},
) {
  const plan = await createPlan(db);
  await db
    .insert(planEntitlements)
    .values({ planId: plan.id, entitlement: 'certificates' });
  await db.insert(subscriptions).values({
    userId,
    planId: plan.id,
    status: 'active',
    active: true,
    ...over,
  });
}

const has = (userId: string) => entitlements.has(userId, 'certificates');

describe('administrative grant windows', () => {
  it('honours a grant inside its window', async () => {
    const u = await createUser(db);
    await grant(u.id, { startsAt: days(-1), expiresAt: days(1) });
    expect(await has(u.id)).toBe(true);
  });

  it('ignores a grant that has expired', async () => {
    const u = await createUser(db);
    await grant(u.id, { expiresAt: days(-1) });
    expect(await has(u.id)).toBe(false);
  });

  it('ignores a grant that has not started yet', async () => {
    const u = await createUser(db);
    await grant(u.id, { startsAt: days(1) });
    expect(await has(u.id)).toBe(false);
  });

  it('ignores a revoked grant', async () => {
    const u = await createUser(db);
    await grant(u.id, { revokedAt: days(-1) });
    expect(await has(u.id)).toBe(false);
  });

  it('lets an in-window deny beat an allow, but not an expired one', async () => {
    const denied = await createUser(db);
    await grant(denied.id);
    await grant(denied.id, { effect: 'deny' });
    expect(await has(denied.id)).toBe(false);

    const allowed = await createUser(db);
    await grant(allowed.id);
    await grant(allowed.id, { effect: 'deny', expiresAt: days(-1) });
    expect(await has(allowed.id)).toBe(true);
  });

  it('lets an in-window deny override a paid plan', async () => {
    const u = await createUser(db);
    await subscribe(u.id, { expiresAt: days(30) });
    await grant(u.id, { effect: 'deny' });
    expect(await has(u.id)).toBe(false);
  });
});

describe('plan subscription windows', () => {
  it('grants an active subscription within its period', async () => {
    const u = await createUser(db);
    await subscribe(u.id, { expiresAt: days(30) });
    const [resolved] = (await entitlements.resolveAll(u.id)).filter(
      (r) => r.entitlement === 'certificates',
    );
    expect(resolved).toMatchObject({ granted: true, source: 'plan' });
  });

  it('refuses an active subscription whose period has ended', async () => {
    const u = await createUser(db);
    await subscribe(u.id, { expiresAt: days(-1) });
    expect(await has(u.id)).toBe(false);
  });

  it('grants a trial until the trial ends, then refuses', async () => {
    const trialing = await createUser(db);
    await subscribe(trialing.id, { status: 'trialing', trialEndsAt: days(3) });
    expect(await has(trialing.id)).toBe(true);

    const lapsed = await createUser(db);
    await subscribe(lapsed.id, { status: 'trialing', trialEndsAt: days(-1) });
    expect(await has(lapsed.id)).toBe(false);
  });

  it('keeps access through the grace period after a failed payment', async () => {
    const inGrace = await createUser(db);
    await subscribe(inGrace.id, {
      status: 'past_due',
      expiresAt: days(-1),
      graceEndsAt: days(2),
    });
    expect(await has(inGrace.id)).toBe(true);

    const graceOver = await createUser(db);
    await subscribe(graceOver.id, {
      status: 'past_due',
      expiresAt: days(-3),
      graceEndsAt: days(-1),
    });
    expect(await has(graceOver.id)).toBe(false);
  });

  it('refuses a subscription that starts in the future or is inactive', async () => {
    const future = await createUser(db);
    await subscribe(future.id, { startsAt: days(1), expiresAt: days(31) });
    expect(await has(future.id)).toBe(false);

    const inactive = await createUser(db);
    await subscribe(inactive.id, { active: false, expiresAt: days(30) });
    expect(await has(inactive.id)).toBe(false);
  });

  it("refuses a plan that doesn't include the entitlement", async () => {
    const u = await createUser(db);
    const plan = await createPlan(db);
    await db
      .insert(planEntitlements)
      .values({ planId: plan.id, entitlement: 'ai:tutor' });
    await db.insert(subscriptions).values({
      userId: u.id,
      planId: plan.id,
      status: 'active',
      active: true,
      expiresAt: days(30),
    });
    expect(await has(u.id)).toBe(false);
    expect(await entitlements.has(u.id, 'ai:tutor')).toBe(true);
  });
});
