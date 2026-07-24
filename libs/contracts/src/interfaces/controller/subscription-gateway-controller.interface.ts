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
  CancelSubscriptionResponseDTO,
  PaymentWebhookResponseDTO,
  SubscribeResponseDTO,
  SubscriptionCheckResponseDTO,
} from '../../dtos/subscription/subscription-responses.dto';
import { SubscriptionResponseDTO } from '../../dtos/subscription/subscription.dto';

/**
 * HTTP gateway controller contracts for the subscription domain.
 */

// ---- Public (api-gateway) ----

export interface ISubscriptionHttpController {
  plans(): Promise<PlanResponseDTO[]>;
  plan(id: string): Promise<PlanResponseDTO>;
  webhook(body: {
    transactionId?: string;
    status?: string;
  }): Promise<PaymentWebhookResponseDTO>;
  subscribe(
    userId: string,
    dto: SubscribeRequestDTO,
  ): Promise<SubscribeResponseDTO>;
  active(userId: string): Promise<ActiveSubscriptionResponseDTO | null>;
  check(userId: string): Promise<SubscriptionCheckResponseDTO>;
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
