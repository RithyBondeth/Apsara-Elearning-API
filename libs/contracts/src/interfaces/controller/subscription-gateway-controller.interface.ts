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
import { SubscribeRequestDTO } from '../../dtos/subscription/subscribe.dto';
import {
  ActiveSubscriptionResponseDTO,
  BillingPortalResponseDTO,
  CancelSubscriptionResponseDTO,
  CheckoutSessionResponseDTO,
  PaymentWebhookResponseDTO,
  SubscriptionCheckResponseDTO,
} from '../../dtos/subscription/subscription-responses.dto';
import { SubscriptionResponseDTO } from '../../dtos/subscription/subscription.dto';
import { ResolvedEntitlementDTO } from '../../dtos/subscription/entitlement.dto';

/**
 * HTTP gateway controller contracts for the subscription domain.
 */

// ---- Public (api-gateway) ----

export interface ISubscriptionHttpController {
  plans(): Promise<PlanResponseDTO[]>;
  plan(id: string): Promise<PlanResponseDTO>;
  webhook(
    rawBody: Buffer,
    signature: string,
  ): Promise<PaymentWebhookResponseDTO>;
  createCheckout(
    userId: string,
    dto: SubscribeRequestDTO,
  ): Promise<CheckoutSessionResponseDTO>;
  createBillingPortal(userId: string): Promise<BillingPortalResponseDTO>;
  active(userId: string): Promise<ActiveSubscriptionResponseDTO | null>;
  check(userId: string): Promise<SubscriptionCheckResponseDTO>;
  entitlements(userId: string): Promise<ResolvedEntitlementDTO[]>;
  history(userId: string): Promise<SubscriptionResponseDTO[]>;
  payments(userId: string): Promise<PaymentResponseDTO[]>;
  cancel(userId: string, id: string): Promise<CancelSubscriptionResponseDTO>;
}

// ---- Admin (admin-gateway) ----

export interface IAdminPlanController {
  create(dto: CreatePlanRequestDTO): Promise<PlanResponseDTO>;
  findAll(): Promise<PlanResponseDTO[]>;
  findOne(id: string): Promise<PlanResponseDTO>;
  update(id: string, dto: UpdatePlanRequestDTO): Promise<PlanResponseDTO>;
  remove(id: string): Promise<DeleteResponseDTO>;
}

export interface IAdminPaymentController {
  create(dto: CreatePaymentRequestDTO): Promise<PaymentResponseDTO>;
}
