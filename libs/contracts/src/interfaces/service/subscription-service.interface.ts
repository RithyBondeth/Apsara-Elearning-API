import { DeleteResponseDTO } from '../../dtos/common/delete-response.dto';
import { PaymentResponseDTO } from '../../dtos/subscription/payment.dto';
import {
  CreatePlanRequestDTO,
  PlanResponseDTO,
  UpdatePlanRequestDTO,
} from '../../dtos/subscription/plan.dto';
import {
  ActiveSubscriptionResponseDTO,
  BillingPortalResponseDTO,
  CancelSubscriptionResponseDTO,
  CheckoutSessionResponseDTO,
  PaymentWebhookResponseDTO,
  SubscriptionCheckResponseDTO,
} from '../../dtos/subscription/subscription-responses.dto';
import { SubscriptionResponseDTO } from '../../dtos/subscription/subscription.dto';
import {
  CreateEntitlementGrantRequestDTO,
  EntitlementGrantResponseDTO,
  ResolvedEntitlementDTO,
} from '../../dtos/subscription/entitlement.dto';

/** DI tokens + service contracts for subscription-service. */

export const I_PAYMENT_SERVICE = 'IPaymentService';
export const I_PLAN_SERVICE = 'IPlanService';
export const I_SUBSCRIPTION_SERVICE = 'ISubscriptionService';
export const I_ENTITLEMENT_ADMIN_SERVICE = 'IEntitlementAdminService';

/** Persisted payment input — `amount` carried as a fixed-2 decimal string. */
export interface RecordPaymentInput {
  userId: string;
  subscriptionId?: string | null;
  amount: string;
  currency: string;
  provider: string;
  transactionId: string;
  status: string;
  providerInvoiceId?: string;
  providerPaymentIntentId?: string;
  providerChargeId?: string;
}

export interface IEntitlementAdminService {
  resolve(userId: string): Promise<ResolvedEntitlementDTO[]>;
  findGrants(userId: string): Promise<EntitlementGrantResponseDTO[]>;
  grant(
    userId: string,
    grantedBy: string,
    dto: CreateEntitlementGrantRequestDTO,
  ): Promise<EntitlementGrantResponseDTO>;
  revoke(id: string): Promise<EntitlementGrantResponseDTO>;
}

export interface IPaymentService {
  record(input: RecordPaymentInput): Promise<PaymentResponseDTO>;
  findByUser(userId: string): Promise<PaymentResponseDTO[]>;
  findOne(id: string): Promise<PaymentResponseDTO>;
  webhook(payload: {
    rawBody: string;
    signature: string;
  }): Promise<PaymentWebhookResponseDTO>;
}

export interface IPlanService {
  create(dto: CreatePlanRequestDTO): Promise<PlanResponseDTO>;
  findAll(): Promise<PlanResponseDTO[]>;
  findOne(id: string): Promise<PlanResponseDTO>;
  update(id: string, dto: UpdatePlanRequestDTO): Promise<PlanResponseDTO>;
  remove(id: string): Promise<DeleteResponseDTO>;
}

export interface ISubscriptionService {
  createCheckout(
    userId: string,
    planId: string,
  ): Promise<CheckoutSessionResponseDTO>;
  createBillingPortal(userId: string): Promise<BillingPortalResponseDTO>;
  findByUser(userId: string): Promise<SubscriptionResponseDTO[]>;
  findActive(userId: string): Promise<ActiveSubscriptionResponseDTO | null>;
  check(userId: string): Promise<SubscriptionCheckResponseDTO>;
  cancel(userId: string, id: string): Promise<CancelSubscriptionResponseDTO>;
}
