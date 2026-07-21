import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreatePaymentRequestDTO,
  CreatePlanRequestDTO,
  SUBSCRIPTION_SERVICE,
  UpdatePlanRequestDTO,
} from '@app/contracts';
import { PlanRpcService } from '../services/plan-rpc.service';
import { SubscriptionRpcService } from '../services/subscription-rpc.service';
import { PaymentRpcService } from '../services/payment-rpc.service';
import { idOf, splitUpdate } from '../utils/payload';

@Controller()
export class SubscriptionRpcController {
  constructor(
    private readonly plans: PlanRpcService,
    private readonly subscriptions: SubscriptionRpcService,
    private readonly payments: PaymentRpcService,
  ) {}

  // ---- Plans ----
  @MessagePattern(SUBSCRIPTION_SERVICE.ACTIONS.PLAN_CREATE)
  createPlan(@Payload() dto: CreatePlanRequestDTO) {
    return this.plans.create(dto);
  }

  @MessagePattern(SUBSCRIPTION_SERVICE.ACTIONS.PLAN_FIND_ALL)
  findPlans() {
    return this.plans.findAll();
  }

  @MessagePattern(SUBSCRIPTION_SERVICE.ACTIONS.PLAN_FIND_ONE)
  findPlan(@Payload() payload: string | { id: string }) {
    return this.plans.findOne(idOf(payload));
  }

  @MessagePattern(SUBSCRIPTION_SERVICE.ACTIONS.PLAN_UPDATE)
  updatePlan(@Payload() payload: UpdatePlanRequestDTO & { id: string }) {
    const { id, data } = splitUpdate(payload);
    return this.plans.update(id, data);
  }

  @MessagePattern(SUBSCRIPTION_SERVICE.ACTIONS.PLAN_DELETE)
  removePlan(@Payload() payload: string | { id: string }) {
    return this.plans.remove(idOf(payload));
  }

  // ---- Subscriptions ----
  @MessagePattern(SUBSCRIPTION_SERVICE.ACTIONS.SUBSCRIBE)
  subscribe(@Payload() payload: { userId: string; planId: string }) {
    return this.subscriptions.subscribe(payload.userId, payload.planId);
  }

  @MessagePattern(SUBSCRIPTION_SERVICE.ACTIONS.SUBSCRIPTION_FIND_BY_USER)
  findByUser(@Payload() payload: { userId: string }) {
    return this.subscriptions.findByUser(payload.userId);
  }

  @MessagePattern(SUBSCRIPTION_SERVICE.ACTIONS.SUBSCRIPTION_FIND_ACTIVE)
  findActive(@Payload() payload: { userId: string }) {
    return this.subscriptions.findActive(payload.userId);
  }

  @MessagePattern(SUBSCRIPTION_SERVICE.ACTIONS.SUBSCRIPTION_CANCEL)
  cancel(@Payload() payload: { userId: string; id: string }) {
    return this.subscriptions.cancel(payload.userId, payload.id);
  }

  @MessagePattern(SUBSCRIPTION_SERVICE.ACTIONS.SUBSCRIPTION_CHECK)
  check(@Payload() payload: { userId: string }) {
    return this.subscriptions.check(payload.userId);
  }

  // ---- Payments ----
  @MessagePattern(SUBSCRIPTION_SERVICE.ACTIONS.PAYMENT_CREATE)
  createPayment(@Payload() dto: CreatePaymentRequestDTO) {
    return this.payments.record({
      userId: dto.userId,
      subscriptionId: dto.subscriptionId ?? null,
      amount: dto.amount.toFixed(2),
      currency: dto.currency ?? 'USD',
      provider: dto.provider,
      transactionId: dto.transactionId,
      status: dto.status,
    });
  }

  @MessagePattern(SUBSCRIPTION_SERVICE.ACTIONS.PAYMENT_FIND_BY_USER)
  findPayments(@Payload() payload: { userId: string }) {
    return this.payments.findByUser(payload.userId);
  }

  @MessagePattern(SUBSCRIPTION_SERVICE.ACTIONS.PAYMENT_FIND_ONE)
  findPayment(@Payload() payload: string | { id: string }) {
    return this.payments.findOne(idOf(payload));
  }

  @MessagePattern(SUBSCRIPTION_SERVICE.ACTIONS.PAYMENT_WEBHOOK)
  webhook(@Payload() payload: { transactionId?: string; status?: string }) {
    return this.payments.webhook(payload);
  }
}
