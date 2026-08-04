import { ConfigService } from '@nestjs/config';
import { StripePaymentProvider } from './stripe.provider';
import { PaymentGatewayService } from './payment-gateway.service';

const config = (values: Record<string, unknown>) =>
  ({ get: (key: string) => values[key] }) as unknown as ConfigService;

const gateway = (overrides: Record<string, unknown>) =>
  overrides as unknown as PaymentGatewayService;

describe('StripePaymentProvider', () => {
  it('reports itself unconfigured without a secret key', () => {
    const provider = new StripePaymentProvider(gateway({}), config({}));
    expect(provider.isConfigured()).toBe(false);
  });

  it('reports itself configured once a secret key is present', () => {
    const provider = new StripePaymentProvider(
      gateway({}),
      config({ 'stripe.secretKey': 'sk_test_123' }),
    );
    expect(provider.isConfigured()).toBe(true);
  });

  it('maps a checkout session onto the neutral shape', async () => {
    const createCheckoutSession = jest
      .fn()
      .mockResolvedValue({ id: 'cs_123', url: 'https://checkout' });
    const provider = new StripePaymentProvider(
      gateway({ createCheckoutSession }),
      config({}),
    );

    const session = await provider.createCheckout({
      userId: 'user-1',
      planId: 'plan-1',
      priceReference: 'price_1',
      customerReference: 'cus_1',
      trialDays: 7,
    });

    expect(session).toEqual({ reference: 'cs_123', url: 'https://checkout' });
    // The neutral names must be translated back to Stripe's vocabulary.
    expect(createCheckoutSession).toHaveBeenCalledWith({
      userId: 'user-1',
      planId: 'plan-1',
      priceId: 'price_1',
      customerId: 'cus_1',
      trialDays: 7,
    });
  });

  it('fails loudly when Stripe returns a session with no URL', async () => {
    const provider = new StripePaymentProvider(
      gateway({
        createCheckoutSession: jest.fn().mockResolvedValue({ id: 'cs_1' }),
      }),
      config({}),
    );

    await expect(
      provider.createCheckout({
        userId: 'u',
        planId: 'p',
        priceReference: 'price_1',
      }),
    ).rejects.toThrow(/checkout URL/);
  });

  it('takes the period end from the latest subscription item', async () => {
    // Stripe moved the period boundary onto items; a subscription ends when
    // its last item does, not its first.
    const provider = new StripePaymentProvider(
      gateway({
        cancelAtPeriodEnd: jest.fn().mockResolvedValue({
          status: 'active',
          cancel_at_period_end: true,
          items: {
            data: [
              { current_period_end: 1_800_000_000 },
              { current_period_end: 1_900_000_000 },
            ],
          },
        }),
      }),
      config({}),
    );

    const snapshot = await provider.cancelAtPeriodEnd('sub_1');

    expect(snapshot.status).toBe('active');
    expect(snapshot.cancelAtPeriodEnd).toBe(true);
    expect(snapshot.currentPeriodEnd).toEqual(new Date(1_900_000_000 * 1000));
  });

  it('reports no period end when there are no items', async () => {
    const provider = new StripePaymentProvider(
      gateway({
        cancelAtPeriodEnd: jest.fn().mockResolvedValue({
          status: 'canceled',
          cancel_at_period_end: false,
          items: { data: [] },
        }),
      }),
      config({}),
    );

    await expect(provider.cancelAtPeriodEnd('sub_1')).resolves.toMatchObject({
      currentPeriodEnd: null,
    });
  });
});
