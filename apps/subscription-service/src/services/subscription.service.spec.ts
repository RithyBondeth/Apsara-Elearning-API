import { SubscriptionService } from './subscription.service';
import type { PlanService } from './plan.service';
import type { PaymentProviderRegistry } from '../payment/payment-provider.registry';

/**
 * Collects the values actually *bound* into a recorded drizzle filter.
 *
 * Only drizzle Param nodes count. Walking every string instead would also pick
 * up column defaults off the schema — `subscriptions.provider` defaults to
 * 'stripe' — and a test that can't tell a bound parameter from a schema default
 * would pass whether or not the query is scoped correctly.
 *
 * Drizzle's SQL objects are cyclic (a table references its columns, which
 * reference the table), so the walk tracks what it has already seen.
 */
function boundParams(
  value: unknown,
  found: unknown[] = [],
  seen = new WeakSet<object>(),
): unknown[] {
  if (!value || typeof value !== 'object') return found;
  if (seen.has(value)) return found;
  seen.add(value);

  const node = value as Record<string, unknown>;
  if ('value' in node && 'encoder' in node) {
    found.push(node.value);
    return found;
  }

  const children = Array.isArray(value) ? value : Object.values(node);
  children.forEach((child) => boundParams(child, found, seen));
  return found;
}

/** Drizzle stand-in that records the filters it was handed. */
function fakeDb(results: unknown[][]) {
  const wheres: unknown[] = [];
  let index = 0;
  const node = (): Record<string, unknown> => {
    const self: Record<string, unknown> = {};
    for (const method of [
      'from',
      'innerJoin',
      'orderBy',
      'limit',
      'returning',
      'set',
      'values',
    ]) {
      self[method] = () => self;
    }
    self.where = (filter: unknown) => {
      wheres.push(filter);
      return self;
    };
    self.then = (
      resolve: (value: unknown) => unknown,
      reject: (reason: unknown) => unknown,
    ) => Promise.resolve(results[index++] ?? []).then(resolve, reject);
    return self;
  };
  return { db: { select: () => node(), update: () => node() }, wheres };
}

const PLAN = {
  id: 'plan-1',
  stripePriceId: 'price_1',
  billingPeriod: 'monthly',
  trialDays: 7,
};

function buildProvider(id: string) {
  const createCheckout = jest
    .fn()
    .mockResolvedValue({ reference: 'ref_1', url: 'https://pay' });
  const provider = {
    id,
    supportsBillingPortal: true,
    isConfigured: () => true,
    createCheckout,
  };
  const registry = {
    active: () => provider,
  } as unknown as PaymentProviderRegistry;
  return { registry, createCheckout };
}

describe('SubscriptionService provider scoping', () => {
  const planService = {
    findOne: jest.fn().mockResolvedValue(PLAN),
  } as unknown as PlanService;

  it('scopes the duplicate-subscription guard to the active rail', async () => {
    // Hardcoding 'stripe' here would switch the guard off the moment a local
    // rail is selected, letting a learner open a second concurrent
    // subscription and be charged twice.
    const { db, wheres } = fakeDb([[], []]);
    const { registry } = buildProvider('payway');
    const service = new SubscriptionService(db as never, planService, registry);

    await service.createCheckout('user-1', 'plan-1');

    const guardFilter = boundParams(wheres[0]);
    expect(guardFilter).toContain('payway');
    expect(guardFilter).not.toContain('stripe');
  });

  it('looks up the customer record on the active rail', async () => {
    const { db, wheres } = fakeDb([[], []]);
    const { registry } = buildProvider('payway');
    const service = new SubscriptionService(db as never, planService, registry);

    await service.createCheckout('user-1', 'plan-1');

    expect(boundParams(wheres[1])).toContain('payway');
  });

  it('still scopes to stripe when stripe is the active rail', async () => {
    const { db, wheres } = fakeDb([[], []]);
    const { registry } = buildProvider('stripe');
    const service = new SubscriptionService(db as never, planService, registry);

    await service.createCheckout('user-1', 'plan-1');

    expect(boundParams(wheres[0])).toContain('stripe');
  });

  it('refuses a second checkout while one subscription is already open', async () => {
    const { db } = fakeDb([[{ id: 'sub-1' }]]);
    const { registry } = buildProvider('stripe');
    const service = new SubscriptionService(db as never, planService, registry);

    await expect(service.createCheckout('user-1', 'plan-1')).rejects.toThrow(
      /already exists/i,
    );
  });

  it('passes the neutral checkout shape to whichever provider is active', async () => {
    const { db } = fakeDb([[], []]);
    const { registry, createCheckout } = buildProvider('payway');
    const service = new SubscriptionService(db as never, planService, registry);

    const result = await service.createCheckout('user-1', 'plan-1');

    expect(createCheckout).toHaveBeenCalledWith({
      userId: 'user-1',
      planId: 'plan-1',
      priceReference: 'price_1',
      customerReference: undefined,
      trialDays: 7,
    });
    expect(result.url).toBe('https://pay');
    expect(result.sessionId).toBe('ref_1');
  });
});
