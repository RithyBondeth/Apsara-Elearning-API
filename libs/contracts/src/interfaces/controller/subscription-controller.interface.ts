import { DeleteResponseDTO } from '../../dtos/common/delete-response.dto';
import {
  CreatePaymentRequestDTO,
  PaymentResponseDTO,
} from '../../dtos/subscription/payment.dto';
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

/**
 * RPC controller contract for subscription-service — plans, subscriptions, and
 * payments handled by the single SubscriptionController.
 */
export interface ISubscriptionRpcController {
  createPlan(dto: CreatePlanRequestDTO): Promise<PlanResponseDTO>;
  findPlans(): Promise<PlanResponseDTO[]>;
  findPlan(payload: string | { id: string }): Promise<PlanResponseDTO>;
  updatePlan(
    payload: UpdatePlanRequestDTO & { id: string },
  ): Promise<PlanResponseDTO>;
  removePlan(payload: string | { id: string }): Promise<DeleteResponseDTO>;
  createCheckout(payload: {
    userId: string;
    planId: string;
  }): Promise<CheckoutSessionResponseDTO>;
  createBillingPortal(payload: {
    userId: string;
  }): Promise<BillingPortalResponseDTO>;
  findByUser(payload: { userId: string }): Promise<SubscriptionResponseDTO[]>;
  findActive(payload: {
    userId: string;
  }): Promise<ActiveSubscriptionResponseDTO | null>;
  cancel(payload: {
    userId: string;
    id: string;
  }): Promise<CancelSubscriptionResponseDTO>;
  check(payload: { userId: string }): Promise<SubscriptionCheckResponseDTO>;
  resolveEntitlements(payload: {
    userId: string;
  }): Promise<ResolvedEntitlementDTO[]>;
  findEntitlementGrants(payload: {
    userId: string;
  }): Promise<EntitlementGrantResponseDTO[]>;
  createEntitlementGrant(payload: {
    userId: string;
    grantedBy: string;
    grant: CreateEntitlementGrantRequestDTO;
  }): Promise<EntitlementGrantResponseDTO>;
  revokeEntitlementGrant(payload: {
    id: string;
  }): Promise<EntitlementGrantResponseDTO>;
  createPayment(dto: CreatePaymentRequestDTO): Promise<PaymentResponseDTO>;
  findPayments(payload: { userId: string }): Promise<PaymentResponseDTO[]>;
  findPayment(payload: string | { id: string }): Promise<PaymentResponseDTO>;
  webhook(payload: {
    rawBody: string;
    signature: string;
  }): Promise<PaymentWebhookResponseDTO>;
}
