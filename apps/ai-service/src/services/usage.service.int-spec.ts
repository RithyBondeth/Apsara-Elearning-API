import { createUser, openTestDb, resetDb } from '../../../../test/db/test-db';
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
    await expect(usage.checkCredits(learner)).resolves.toEqual({
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
