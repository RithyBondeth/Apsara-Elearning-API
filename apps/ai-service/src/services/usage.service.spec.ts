import { UsageService } from './usage.service';

/**
 * AI usage reporting. The shape here was previously wrong — the DTO declared
 * `tokensUsed`/`creditsRemaining`, neither of which is a column — so these
 * pin the real fields as well as the allowance arithmetic.
 */

const TOKEN_LIMIT = 1_000_000;

function fakeDb(selects: unknown[][]) {
  let si = 0;
  const db = {
    select: () => {
      const idx = si++;
      const node: Record<string, unknown> = {};
      for (const m of ['from', 'where', 'orderBy', 'limit']) node[m] = () => node;
      node.then = (res: (v: unknown) => unknown, rej: (r: unknown) => unknown) =>
        Promise.resolve(selects[idx] ?? []).then(res, rej);
      return node;
    },
  };
  return { db };
}

const usageRow = (over: Record<string, unknown> = {}) => ({
  id: 'usage-1',
  userId: 'u1',
  feature: 'tutor',
  promptTokens: 120,
  completionTokens: 30,
  totalTokens: 150,
  provider: 'anthropic',
  model: 'claude-sonnet-5',
  createdAt: new Date('2026-09-24T09:00:00Z'),
  updatedAt: new Date('2026-09-24T09:00:00Z'),
  ...over,
});

describe('UsageService.checkCredits', () => {
  it('reports the allowance against tokens spent', async () => {
    const { db } = fakeDb([[{ used: 150 }]]);
    const credits = await new UsageService(db as never).checkCredits('u1');

    expect(credits).toEqual({
      used: 150,
      limit: TOKEN_LIMIT,
      remaining: TOKEN_LIMIT - 150,
      hasCredits: true,
    });
  });

  it('treats an account with no usage as untouched', async () => {
    const { db } = fakeDb([[]]);
    const credits = await new UsageService(db as never).checkCredits('u1');
    expect(credits).toMatchObject({ used: 0, remaining: TOKEN_LIMIT, hasCredits: true });
  });

  it('never reports negative remaining once the limit is passed', async () => {
    const { db } = fakeDb([[{ used: TOKEN_LIMIT + 5_000 }]]);
    const credits = await new UsageService(db as never).checkCredits('u1');
    expect(credits.remaining).toBe(0);
    expect(credits.hasCredits).toBe(false);
  });

  it('reports exhausted exactly at the limit', async () => {
    const { db } = fakeDb([[{ used: TOKEN_LIMIT }]]);
    const credits = await new UsageService(db as never).checkCredits('u1');
    expect(credits).toMatchObject({ remaining: 0, hasCredits: false });
  });
});

describe('UsageService.findByUser', () => {
  it('returns the allowance alongside the recent calls', async () => {
    // recent rows, then the credits sum
    const { db } = fakeDb([[usageRow(), usageRow({ id: 'usage-2' })], [{ used: 300 }]]);

    const summary = await new UsageService(db as never).findByUser('u1', 20);

    expect(summary).toMatchObject({ used: 300, limit: TOKEN_LIMIT, hasCredits: true });
    expect(summary.recent).toHaveLength(2);
  });

  it('carries the real usage columns, not the old phantom fields', async () => {
    const { db } = fakeDb([[usageRow()], [{ used: 150 }]]);

    const [record] = (await new UsageService(db as never).findByUser('u1', 20)).recent;

    expect(record).toMatchObject({
      feature: 'tutor',
      promptTokens: 120,
      completionTokens: 30,
      totalTokens: 150,
      provider: 'anthropic',
      model: 'claude-sonnet-5',
    });
    // The previous DTO promised these and always sent undefined.
    expect(record).not.toHaveProperty('tokensUsed');
    expect(record).not.toHaveProperty('creditsRemaining');
  });

  it('reports an empty history without failing', async () => {
    const { db } = fakeDb([[], []]);
    const summary = await new UsageService(db as never).findByUser('u1', 20);
    expect(summary.recent).toEqual([]);
    expect(summary.used).toBe(0);
  });
});
