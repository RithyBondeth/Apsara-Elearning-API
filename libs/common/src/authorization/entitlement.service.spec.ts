import { ENTITLEMENTS } from '@app/contracts';
import { EntitlementService } from './entitlement.service';

/**
 * The access-control precedence engine. `resolveOne` runs up to three queries
 * in order — deny grant, allow grant, then plan — and the FIRST hit wins:
 * deny > allow > plan > none.
 *
 * The SQL time-window predicates (grace/trial/expiry) are not exercised here —
 * a query mock returns whatever we queue regardless of its WHERE clause, so
 * those belong to an integration test against a real database. What lives in
 * *code* and is pinned here: the ordering/short-circuit and the `validUntil`
 * selection for a matched plan.
 */

const KEY = 'ai:tutor';

/**
 * Drizzle stand-in: the Nth `select()` resolves to the Nth queued result set.
 * `queryCount()` proves how far resolution got before short-circuiting.
 */
function fakeDb(results: unknown[][]) {
  let selects = 0;
  const db = {
    select: () => {
      const index = selects++;
      const node: Record<string, unknown> = {};
      for (const m of [
        'from',
        'leftJoin',
        'innerJoin',
        'where',
        'orderBy',
        'groupBy',
        'limit',
        'offset',
      ]) {
        node[m] = () => node;
      }
      node.then = (
        resolve: (v: unknown) => unknown,
        reject: (r: unknown) => unknown,
      ) => Promise.resolve(results[index] ?? []).then(resolve, reject);
      return node;
    },
  };
  return { db, queryCount: () => selects };
}

/**
 * Order-independent db for inspecting a resolved DTO. `resolveAll` runs its keys
 * concurrently (Promise.all), so an index-based mock is unreliable here; instead
 * we answer by query *type* — the plan query is the only one that innerJoins.
 * Every key then resolves identically, so `all[0]` is deterministic.
 */
function scenarioDb(nonJoinRows: unknown[], planRows: unknown[]) {
  return {
    select: () => {
      let joined = false;
      const node: Record<string, unknown> = {};
      for (const m of ['from', 'leftJoin', 'where', 'orderBy', 'groupBy', 'limit', 'offset']) {
        node[m] = () => node;
      }
      node.innerJoin = () => {
        joined = true;
        return node;
      };
      node.then = (
        resolve: (v: unknown) => unknown,
        reject: (r: unknown) => unknown,
      ) => Promise.resolve(joined ? planRows : nonJoinRows).then(resolve, reject);
      return node;
    },
  };
}

/** First resolved DTO, using the query-type-based db above. */
async function resolveFirst(nonJoinRows: unknown[], planRows: unknown[]) {
  const service = new EntitlementService(scenarioDb(nonJoinRows, planRows) as never);
  const all = await service.resolveAll('u1');
  return all[0];
}

describe('EntitlementService precedence', () => {
  it('a deny grant wins and stops before allow/plan are queried', async () => {
    const { db, queryCount } = fakeDb([[{ expiresAt: null }]]);
    const service = new EntitlementService(db as never);

    await expect(service.has('u1', KEY)).resolves.toBe(false);
    expect(queryCount()).toBe(1); // short-circuited at the deny check
  });

  it('an allow grant (no deny) grants and stops before the plan query', async () => {
    const { db, queryCount } = fakeDb([[], [{ expiresAt: null }]]);
    const service = new EntitlementService(db as never);

    await expect(service.has('u1', KEY)).resolves.toBe(true);
    expect(queryCount()).toBe(2);
  });

  it('falls through to an active plan when no admin grant applies', async () => {
    const future = new Date(Date.now() + 60_000);
    const { db, queryCount } = fakeDb([
      [],
      [],
      [{ expiresAt: future, graceEndsAt: null, trialEndsAt: null }],
    ]);
    const service = new EntitlementService(db as never);

    await expect(service.has('u1', KEY)).resolves.toBe(true);
    expect(queryCount()).toBe(3);
  });

  it('denies when nothing matches after all three queries', async () => {
    const { db, queryCount } = fakeDb([[], [], []]);
    const service = new EntitlementService(db as never);

    await expect(service.has('u1', KEY)).resolves.toBe(false);
    expect(queryCount()).toBe(3);
  });
});

describe('EntitlementService resolved detail', () => {
  it('reports an administrative source and the deny window on a deny', async () => {
    const until = new Date(Date.now() + 60_000);
    const dto = await resolveFirst([{ expiresAt: until }], []);
    expect(dto).toMatchObject({
      granted: false,
      source: 'administrative',
      validUntil: until,
    });
  });

  it('reports source "none" when nothing grants access', async () => {
    const dto = await resolveFirst([], []);
    expect(dto).toMatchObject({ granted: false, source: 'none', validUntil: null });
  });
});

describe('EntitlementService plan validUntil', () => {
  const expiresAt = new Date(Date.now() + 10_000);

  it('prefers an in-progress grace period', async () => {
    const graceEndsAt = new Date(Date.now() + 60_000);
    const dto = await resolveFirst([], [{ expiresAt, graceEndsAt, trialEndsAt: null }]);
    expect(dto).toMatchObject({ granted: true, source: 'plan', validUntil: graceEndsAt });
  });

  it('falls back to an active trial when grace has passed', async () => {
    const trialEndsAt = new Date(Date.now() + 60_000);
    const dto = await resolveFirst(
      [],
      [{ expiresAt, graceEndsAt: new Date(Date.now() - 1), trialEndsAt }],
    );
    expect(dto.validUntil).toEqual(trialEndsAt);
  });

  it('uses the paid expiry when there is no grace or trial', async () => {
    const dto = await resolveFirst([], [{ expiresAt, graceEndsAt: null, trialEndsAt: null }]);
    expect(dto.validUntil).toEqual(expiresAt);
  });
});

describe('EntitlementService.assert', () => {
  it('resolves silently when the entitlement is granted', async () => {
    const { db } = fakeDb([[], [{ expiresAt: null }]]);
    const service = new EntitlementService(db as never);
    await expect(service.assert('u1', KEY)).resolves.toBeUndefined();
  });

  it('throws a 403 when the entitlement is missing', async () => {
    const { db } = fakeDb([[], [], []]);
    const service = new EntitlementService(db as never);
    await expect(service.assert('u1', KEY)).rejects.toMatchObject({
      error: { statusCode: 403 },
    });
  });
});

describe('EntitlementService.resolveAll', () => {
  it('returns one entry per known entitlement key', async () => {
    const { db } = fakeDb([]); // every query resolves empty -> all "none"
    const service = new EntitlementService(db as never);

    const all = await service.resolveAll('u1');

    expect(all).toHaveLength(ENTITLEMENTS.length);
    expect(all.map((e) => e.entitlement).sort()).toEqual([...ENTITLEMENTS].sort());
    expect(all.every((e) => e.granted === false)).toBe(true);
  });
});
