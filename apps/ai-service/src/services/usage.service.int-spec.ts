import { EntitlementService } from '@app/common';
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
import { UsageService } from './usage.service';

/**
 * The allowance window is a SQL predicate on created_at, so only a real
 * database shows which rows it counts.
 */
const { sql, db } = openTestDb();
const usage = new UsageService(
  db as never,
  {
    get: (key: string) => (key === 'ai.monthlyTokenLimit' ? 1_000 : undefined),
  } as never,
  new EntitlementService(db as never),
);

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86_400_000).toISOString();

async function spend(userId: string, tokens: number, createdAt: string) {
  await sql`
    INSERT INTO ai_usage_tracking (user_id, feature, total_tokens, created_at)
    VALUES (${userId}, 'chat', ${tokens}, ${createdAt})
  `;
}

afterAll(() => sql.end({ timeout: 1 }));

describe('UsageService.checkCredits window', () => {
  let learner: string;
  let other: string;

  beforeAll(async () => {
    await resetDb(sql);
    learner = (await createUser(db)).id;
    other = (await createUser(db)).id;
    await spend(learner, 900, daysAgo(45)); // outside the 30-day window
    await spend(learner, 300, daysAgo(29));
    await spend(learner, 200, daysAgo(1));
    await spend(other, 5_000, daysAgo(1)); // someone else's usage
  });

  it('counts only this learner’s tokens from the last 30 days', async () => {
    await expect(usage.checkCredits(learner)).resolves.toMatchObject({
      used: 500,
      limit: 1_000,
      remaining: 500,
      hasCredits: true,
    });
  });

  it('refuses once the window total reaches the limit', async () => {
    await expect(usage.checkCredits(other)).resolves.toMatchObject({
      remaining: 0,
      hasCredits: false,
    });
  });
});

describe('UsageService.checkCredits reply allowance', () => {
  /** A learner on a plan that includes the tutor, mid billing period. */
  async function subscriber(aiCredits: number, periodStartDaysAgo = 10) {
    const learner = (await createUser(db)).id;
    const plan = await createPlan(db, { aiCredits });
    await db
      .insert(planEntitlements)
      .values({ planId: plan.id, entitlement: 'ai:tutor' });
    await db.insert(subscriptions).values({
      userId: learner,
      planId: plan.id,
      status: 'active',
      active: true,
      currentPeriodStart: days(-periodStartDaysAgo),
      currentPeriodEnd: days(30 - periodStartDaysAgo),
    });
    return learner;
  }

  beforeEach(() => resetDb(sql));

  it('counts this billing period’s replies against the plan’s credits', async () => {
    const learner = await subscriber(3);
    await spend(learner, 10, daysAgo(12)); // last period: not counted
    await spend(learner, 10, daysAgo(5));
    await spend(learner, 10, daysAgo(1));

    const credits = await usage.checkCredits(learner);

    expect(credits).toMatchObject({
      repliesUsed: 2,
      repliesLimit: 3,
      repliesRemaining: 1,
      hasCredits: true,
      exhausted: null,
    });
    expect(credits.periodEndsAt).toBeInstanceOf(Date);
  });

  it('refuses once the plan’s replies for the period are used', async () => {
    const learner = await subscriber(2);
    await spend(learner, 10, daysAgo(3));
    await spend(learner, 10, daysAgo(2));

    await expect(usage.checkCredits(learner)).resolves.toMatchObject({
      repliesRemaining: 0,
      hasCredits: false,
      exhausted: 'replies',
    });
  });

  it('a renewal starts a fresh allowance', async () => {
    // Same usage, but the period began yesterday.
    const learner = await subscriber(2, 1);
    await spend(learner, 10, daysAgo(3));
    await spend(learner, 10, daysAgo(2));

    await expect(usage.checkCredits(learner)).resolves.toMatchObject({
      repliesUsed: 0,
      hasCredits: true,
    });
  });

  it('a plan with 0 credits and an admin grant have no per-reply limit', async () => {
    const zero = await subscriber(0);
    const granted = (await createUser(db)).id;
    await db.insert(userEntitlementGrants).values({
      userId: granted,
      entitlement: 'ai:tutor',
      effect: 'allow',
      reason: 'courtesy',
    });

    for (const learner of [zero, granted]) {
      await expect(usage.checkCredits(learner)).resolves.toMatchObject({
        repliesLimit: null,
        repliesRemaining: null,
        periodEndsAt: null,
        hasCredits: true,
      });
    }
  });

  it('the token cap still applies on top of the reply allowance', async () => {
    const learner = await subscriber(100);
    await spend(learner, 1_000, daysAgo(1)); // the 1,000-token test cap

    await expect(usage.checkCredits(learner)).resolves.toMatchObject({
      repliesRemaining: 99,
      hasCredits: false,
      exhausted: 'tokens',
    });
  });
});
