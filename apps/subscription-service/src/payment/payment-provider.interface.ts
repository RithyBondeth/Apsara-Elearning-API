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
 * opening a billing portal, cancelling, refunding. Inbound webhook ingestion stays
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

/**
 * Which money to give back. References are the provider-side ids stored on
 * the payment row; a rail uses whichever it can resolve.
 */
export interface IRefundInput {
  paymentReference?: string;
  chargeReference?: string;
  invoiceReference?: string;
  /** In the currency's minor unit (cents). */
  amountMinor: number;
  /** Same key → same refund: a retried or double-clicked request can't pay out twice. */
  idempotencyKey: string;
  metadata: Record<string, string>;
}

export interface IRefundResult {
  reference: string;
  /** Provider vocabulary, stored verbatim (Stripe: pending, succeeded, failed…). */
  status: string;
  amountMinor: number;
  currency: string;
  reason: string | null;
  failureReason: string | null;
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

  /** Ends the subscription now, with no further billing. */
  cancelNow(providerSubscriptionId: string): Promise<ISubscriptionSnapshot>;

  refund(input: IRefundInput): Promise<IRefundResult>;
}
