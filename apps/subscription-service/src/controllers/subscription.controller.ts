import { Controller, Inject } from '@nestjs/common';
import {
  I_PAYMENT_SERVICE,
  I_PLAN_SERVICE,
  I_SUBSCRIPTION_SERVICE,
  I_ENTITLEMENT_ADMIN_SERVICE,
} from '@app/contracts';
import type {
  IPaymentService,
  IPlanService,
  ISubscriptionRpcController,
  ISubscriptionService,
  IEntitlementAdminService,
} from '@app/contracts';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreatePaymentRequestDTO,
  CreatePlanRequestDTO,
  SUBSCRIPTION_SERVICE,
  UpdatePlanRequestDTO,
  CreateEntitlementGrantRequestDTO,
} from '@app/contracts';
import { idOf, splitUpdate } from '@app/utils';

@Controller()
export class SubscriptionController implements ISubscriptionRpcController {
  constructor(
    @Inject(I_PLAN_SERVICE) private readonly plans: IPlanService,
    @Inject(I_SUBSCRIPTION_SERVICE)
    private readonly subscriptions: ISubscriptionService,
    @Inject(I_PAYMENT_SERVICE) private readonly payments: IPaymentService,
    @Inject(I_ENTITLEMENT_ADMIN_SERVICE)
    private readonly entitlementAdmin: IEntitlementAdminService,
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
  @MessagePattern(SUBSCRIPTION_SERVICE.ACTIONS.CHECKOUT_CREATE)
  createCheckout(@Payload() payload: { userId: string; planId: string }) {
    return this.subscriptions.createCheckout(payload.userId, payload.planId);
  }

  @MessagePattern(SUBSCRIPTION_SERVICE.ACTIONS.BILLING_PORTAL_CREATE)
  createBillingPortal(@Payload() payload: { userId: string }) {
    return this.subscriptions.createBillingPortal(payload.userId);
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

  @MessagePattern(SUBSCRIPTION_SERVICE.ACTIONS.ENTITLEMENT_RESOLVE)
  resolveEntitlements(@Payload() payload: { userId: string }) {
    return this.entitlementAdmin.resolve(payload.userId);
  }

  @MessagePattern(SUBSCRIPTION_SERVICE.ACTIONS.ENTITLEMENT_GRANTS_FIND)
  findEntitlementGrants(@Payload() payload: { userId: string }) {
    return this.entitlementAdmin.findGrants(payload.userId);
  }

  @MessagePattern(SUBSCRIPTION_SERVICE.ACTIONS.ENTITLEMENT_GRANT_CREATE)
  createEntitlementGrant(
    @Payload()
    payload: {
      userId: string;
      grantedBy: string;
      grant: CreateEntitlementGrantRequestDTO;
    },
  ) {
    return this.entitlementAdmin.grant(
      payload.userId,
      payload.grantedBy,
      payload.grant,
    );
  }

  @MessagePattern(SUBSCRIPTION_SERVICE.ACTIONS.ENTITLEMENT_GRANT_REVOKE)
  revokeEntitlementGrant(@Payload() payload: { id: string }) {
    return this.entitlementAdmin.revoke(payload.id);
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
  webhook(@Payload() payload: { rawBody: string; signature: string }) {
    return this.payments.webhook(payload);
  }
}
