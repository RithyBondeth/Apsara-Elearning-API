import Stripe from 'stripe';
import { PaymentService } from './payment.service';

function limitedQuery(rows: unknown[]) {
  const query = {
    from: jest.fn(),
    where: jest.fn(),
    limit: jest.fn().mockResolvedValue(rows),
  };
  query.from.mockReturnValue(query);
  query.where.mockReturnValue(query);
  return query;
}

function selectedRows(rows: unknown[]) {
  const query = {
    from: jest.fn(),
    where: jest.fn().mockResolvedValue(rows),
  };
  query.from.mockReturnValue(query);
  return query;
}

function insertQuery(result: unknown = undefined) {
  const query = {
    values: jest.fn(),
    onConflictDoUpdate: jest.fn().mockResolvedValue(result),
  };
  query.values.mockReturnValue(query);
  return query;
}

function eventClaimQuery(rows: unknown[]) {
  const query = {
    values: jest.fn(),
    onConflictDoNothing: jest.fn(),
    returning: jest.fn().mockResolvedValue(rows),
  };
  query.values.mockReturnValue(query);
  query.onConflictDoNothing.mockReturnValue(query);
  return query;
}

function updateQuery() {
  const query = {
    set: jest.fn(),
    where: jest.fn().mockResolvedValue(undefined),
  };
  query.set.mockReturnValue(query);
  return query;
}

describe('PaymentService refunds', () => {
  it('upserts refund updates and revokes only a fully refunded current period', async () => {
    const payment = {
      id: 'payment-1',
      userId: 'user-1',
      subscriptionId: 'subscription-1',
      amount: '10.00',
      createdAt: new Date('2026-07-28T00:00:00Z'),
    };
    const paymentUpdate = updateQuery();
    const subscriptionUpdate = updateQuery();
    const db = {
      select: jest
        .fn()
        .mockReturnValueOnce(limitedQuery([payment]))
        .mockReturnValueOnce(selectedRows([{ amount: '10.00' }])),
      insert: jest.fn().mockReturnValue(insertQuery()),
      update: jest
        .fn()
        .mockReturnValueOnce(paymentUpdate)
        .mockReturnValueOnce(subscriptionUpdate),
    };
    const service = new PaymentService(db as never, {} as never);
    const handleRefund = Reflect.get(service, 'handleRefund') as (
      refund: Stripe.Refund,
    ) => Promise<void>;

    await handleRefund.call(service, {
      id: 're_1',
      object: 'refund',
      amount: 1000,
      currency: 'usd',
      payment_intent: 'pi_1',
      charge: null,
      status: 'succeeded',
      reason: 'requested_by_customer',
      failure_reason: undefined,
    } as Stripe.Refund);

    expect(paymentUpdate.set).toHaveBeenCalledWith(
      expect.objectContaining({
        refundedAmount: '10.00',
        refundStatus: 'refunded',
      }),
    );
    expect(subscriptionUpdate.set).toHaveBeenCalledWith(
      expect.objectContaining({ active: false }),
    );
  });

  it('acknowledges an event that was already processed without processing it again', async () => {
    const event = {
      id: 'evt_duplicate',
      type: 'invoice.paid',
      livemode: false,
    } as Stripe.Event;
    const db = {
      insert: jest.fn().mockReturnValue(eventClaimQuery([])),
      select: jest
        .fn()
        .mockReturnValue(limitedQuery([{ status: 'processed' }])),
    };
    const gateway = {
      constructWebhookEvent: jest.fn().mockReturnValue(event),
    };
    const service = new PaymentService(db as never, gateway as never);

    await expect(
      service.webhook({ rawBody: '', signature: 'signature' }),
    ).resolves.toEqual(expect.objectContaining({ handled: true }));
    expect(db.insert).toHaveBeenCalledTimes(1);
  });
});
