import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentGatewayService } from './payment-gateway.service';

const webhookSecret = 'whsec_test_secret';

function service(nodeEnv = 'test') {
  const values: Record<string, string> = {
    nodeEnv,
    'stripe.secretKey': 'sk_test_placeholder',
    'stripe.webhookSecret': webhookSecret,
    'web.appUrl': 'http://localhost:3000',
  };
  return new PaymentGatewayService({
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService);
}

describe('PaymentGatewayService webhook verification', () => {
  it('accepts an event signed with the configured endpoint secret', () => {
    const payload = JSON.stringify({
      id: 'evt_test',
      object: 'event',
      type: 'checkout.session.completed',
      livemode: false,
      data: { object: {} },
    });
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
    });

    expect(
      service().constructWebhookEvent(Buffer.from(payload), signature).id,
    ).toBe('evt_test');
  });

  it('rejects a webhook with an invalid signature', () => {
    expect(() =>
      service().constructWebhookEvent(Buffer.from('{}'), 'bad-signature'),
    ).toThrow();
  });

  it('rejects non-HTTPS return URLs in production', () => {
    expect(() => service('production').onModuleInit()).toThrow(
      'WEB_APP_URL must use HTTPS in production',
    );
  });
});
