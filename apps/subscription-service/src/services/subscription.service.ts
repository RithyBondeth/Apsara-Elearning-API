import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, desc, eq, gt, isNull, or } from 'drizzle-orm';
import { subscriptions } from '@app/database/schemas/subscription/subscription.schema';
import { plans } from '@app/database/schemas/subscription/plan.schema';
import {
  ActiveSubscriptionResponseDTO,
  CancelSubscriptionResponseDTO,
  DRIZZLE,
  ISubscriptionService,
  PlanResponseDTO,
  SubscribeResponseDTO,
  SubscriptionCheckResponseDTO,
  SubscriptionResponseDTO,
} from '@app/contracts';
import { RpcBadRequestException, RpcNotFoundException } from '@app/common';
import { PaymentGatewayService } from '../payment/payment-gateway.service';
import { PlanService } from './plan.service';
import { PaymentService } from './payment.service';

@Injectable()
export class SubscriptionService implements ISubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    private readonly planService: PlanService,
    private readonly paymentService: PaymentService,
    private readonly gateway: PaymentGatewayService,
  ) {}

  async subscribe(
    userId: string,
    planId: string,
  ): Promise<SubscribeResponseDTO> {
    const plan = await this.planService.findOne(planId);
    const price = plan.price.toFixed(2);

    // Charge through the (mock) payment gateway.
    const charge = await this.gateway.charge(price, 'USD');
    if (charge.status !== 'succeeded') {
      throw new RpcBadRequestException('Payment failed');
    }

    // One active subscription at a time — deactivate any prior ones.
    await this.db
      .update(subscriptions)
      .set({ active: false, updatedAt: new Date() })
      .where(
        and(eq(subscriptions.userId, userId), eq(subscriptions.active, true)),
      );

    const startsAt = new Date();
    const expiresAt = this.computeExpiry(plan.billingPeriod, startsAt);

    const [subscription] = await this.db
      .insert(subscriptions)
      .values({ userId, planId, startsAt, expiresAt, active: true })
      .returning();

    const payment = await this.paymentService.record({
      userId,
      subscriptionId: subscription.id,
      amount: price,
      currency: 'USD',
      provider: charge.provider,
      transactionId: charge.transactionId,
      status: charge.status,
    });

    this.logger.log(`User ${userId} subscribed to ${plan.slug}`);
    return new SubscribeResponseDTO({
      subscription: new SubscriptionResponseDTO(subscription),
      plan,
      payment,
    });
  }

  async findByUser(userId: string): Promise<SubscriptionResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));
    return rows.map((row) => new SubscriptionResponseDTO(row));
  }

  async findActive(
    userId: string,
  ): Promise<ActiveSubscriptionResponseDTO | null> {
    const [row] = await this.db
      .select({ subscription: subscriptions, plan: plans })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(this.activeWhere(userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    if (!row) return null;
    return new ActiveSubscriptionResponseDTO({
      subscription: new SubscriptionResponseDTO(row.subscription),
      plan: new PlanResponseDTO({
        ...row.plan,
        price: Number(row.plan.price),
      }),
    });
  }

  async check(userId: string): Promise<SubscriptionCheckResponseDTO> {
    const active = await this.findActive(userId);
    return new SubscriptionCheckResponseDTO({
      subscribed: !!active,
      subscription: active?.subscription ?? null,
      plan: active?.plan ?? null,
    });
  }

  async cancel(
    userId: string,
    id: string,
  ): Promise<CancelSubscriptionResponseDTO> {
    const [cancelled] = await this.db
      .update(subscriptions)
      .set({ active: false, updatedAt: new Date() })
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)))
      .returning();
    if (!cancelled) throw new RpcNotFoundException('Subscription not found');
    this.logger.log(`Subscription cancelled: ${id}`);
    return new CancelSubscriptionResponseDTO({
      message: 'Subscription cancelled',
      id,
      subscription: new SubscriptionResponseDTO(cancelled),
    });
  }

  private activeWhere(userId: string) {
    return and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.active, true),
      or(
        isNull(subscriptions.expiresAt),
        gt(subscriptions.expiresAt, new Date()),
      ),
    );
  }

  private computeExpiry(period: string | undefined, from: Date): Date | null {
    if (period === 'lifetime') return null;
    const d = new Date(from);
    if (period === 'yearly') d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1); // monthly (default)
    return d;
  }
}
