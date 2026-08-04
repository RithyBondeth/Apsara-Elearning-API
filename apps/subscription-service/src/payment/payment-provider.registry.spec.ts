import { ConfigService } from '@nestjs/config';
import { PaymentProviderRegistry } from './payment-provider.registry';
import { StripePaymentProvider } from './stripe.provider';

const config = (values: Record<string, unknown>) =>
  ({ get: (key: string) => values[key] }) as unknown as ConfigService;

const stripeProvider = (configured: boolean) =>
  ({
    id: 'stripe',
    supportsBillingPortal: true,
    isConfigured: () => configured,
  }) as unknown as StripePaymentProvider;

describe('PaymentProviderRegistry', () => {
  it('defaults to stripe when no provider is configured', () => {
    const registry = new PaymentProviderRegistry(
      config({}),
      stripeProvider(true),
    );

    expect(registry.active().id).toBe('stripe');
  });

  it('resolves the provider named in config', () => {
    const registry = new PaymentProviderRegistry(
      config({ 'payments.provider': 'stripe' }),
      stripeProvider(true),
    );

    expect(registry.active().id).toBe('stripe');
  });

  it('names the unknown provider rather than failing vaguely', () => {
    const registry = new PaymentProviderRegistry(
      config({ 'payments.provider': 'payway' }),
      stripeProvider(true),
    );

    // A local rail that was configured but never implemented should say so.
    expect(() => registry.active()).toThrow(/payway/);
  });

  it('distinguishes "not configured" from "unknown"', () => {
    const registry = new PaymentProviderRegistry(
      config({ 'payments.provider': 'stripe' }),
      stripeProvider(false),
    );

    expect(() => registry.active()).toThrow(/selected but not configured/);
  });
});
