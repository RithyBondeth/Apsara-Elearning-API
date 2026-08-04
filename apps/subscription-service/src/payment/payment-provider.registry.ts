import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcInternalException } from '@app/common';
import {
  IPaymentProvider,
  PAYMENT_PROVIDERS,
  PaymentProviderId,
} from './payment-provider.interface';
import { StripePaymentProvider } from './stripe.provider';

/**
 * Resolves the active payment rail from `payments.provider`.
 *
 * Adding a local rail is: implement IPaymentProvider, add its id to
 * PAYMENT_PROVIDERS, and register it here. Nothing in SubscriptionService
 * changes.
 */
@Injectable()
export class PaymentProviderRegistry {
  private readonly logger = new Logger(PaymentProviderRegistry.name);
  private readonly providers: Map<PaymentProviderId, IPaymentProvider>;

  constructor(
    private readonly config: ConfigService,
    stripe: StripePaymentProvider,
  ) {
    this.providers = new Map<PaymentProviderId, IPaymentProvider>([
      [stripe.id, stripe],
    ]);
  }

  /** The configured rail, or a clear error explaining what is missing. */
  active(): IPaymentProvider {
    const configured = this.config.get<string>('payments.provider') ?? 'stripe';

    const provider = this.providers.get(configured as PaymentProviderId);
    if (!provider) {
      throw new RpcInternalException(
        `Unknown payment provider '${configured}'. Expected one of: ${PAYMENT_PROVIDERS.join(', ')}`,
      );
    }
    if (!provider.isConfigured()) {
      // Named explicitly: "billing is not configured" sends people hunting
      // through the wrong provider's credentials.
      throw new RpcInternalException(
        `Payment provider '${provider.id}' is selected but not configured`,
      );
    }
    return provider;
  }
}
