/**
 * The port every payment rail implements.
 *
 * Stripe does not operate in Cambodia, so the subscription flow has to be able
 * to run on a local rail (ABA PayWay, Bakong/KHQR, Wing) without being rewritten
 * around it. Everything here is deliberately provider-neutral: no Stripe types
 * leak across this boundary, so `SubscriptionService` never learns which rail it
 * is talking to.
 *
 * Scope note: this covers the *outbound* operations — starting a checkout,
 * opening a billing portal, cancelling. Inbound webhook ingestion stays
 * provider-specific (see PaymentService), because event shapes and signature
 * schemes have nothing in common between providers and pretending otherwise
 * would buy an abstraction nobody can implement.
 */

/** DI token — resolve the rail selected by `payments.provider`. */
export const PAYMENT_PROVIDER = 'IPaymentProvider';

export const PAYMENT_PROVIDERS = ['stripe'] as const;
export type PaymentProviderId = (typeof PAYMENT_PROVIDERS)[number];

export interface ICheckoutInput {
  userId: string;
  planId: string;
  /** The provider's own identifier for the priced thing (Stripe: a price id). */
  priceReference: string;
  /** A returning payer's provider-side customer record, when we have one. */
  customerReference?: string;
  trialDays?: number;
}

export interface ICheckoutSession {
  /** Provider-side id for this checkout, stored for reconciliation. */
  reference: string;
  /** Where to send the payer to complete payment. */
  url: string;
}

/**
 * The subset of a provider's subscription state the local records mirror.
 * `status` stays a free string: providers disagree on the vocabulary and the
 * column already stores it verbatim.
 */
export interface ISubscriptionSnapshot {
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
}

export interface IPaymentProvider {
  readonly id: PaymentProviderId;

  /** False when credentials are missing, so callers can fail with a clear message. */
  isConfigured(): boolean;

  /**
   * Whether this rail hosts its own subscription-management portal. Local rails
   * generally don't, and the caller should surface in-app cancellation instead.
   */
  readonly supportsBillingPortal: boolean;

  createCheckout(input: ICheckoutInput): Promise<ICheckoutSession>;

  createBillingPortal(customerReference: string): Promise<{ url: string }>;

  cancelAtPeriodEnd(
    providerSubscriptionId: string,
  ): Promise<ISubscriptionSnapshot>;
}
