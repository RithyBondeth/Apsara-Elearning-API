import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, desc, eq, gt, isNull, or } from 'drizzle-orm';
import { subscriptions } from '@app/database/schemas/subscription/subscription.schema';
import { plans } from '@app/database/schemas/subscription/plan.schema';
import { DRIZZLE } from '@app/contracts';
import { RpcBadRequestException, RpcNotFoundException } from '@app/common';
import { PlanRpcService } from './plan-rpc.service';
import { PaymentRpcService } from './payment-rpc.service';
import { PaymentGatewayService } from '../payment/payment-gateway.service';

@Injectable()
export class SubscriptionRpcService {
  private readonly logger = new Logger(SubscriptionRpcService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    private readonly planService: PlanRpcService,
    private readonly paymentService: PaymentRpcService,
    private readonly gateway: PaymentGatewayService,
  ) {}

  async subscribe(userId: string, planId: string) {
    const plan = await this.planService.findOne(planId);

    // Charge through the (mock) payment gateway.
    const charge = await this.gateway.charge(plan.price, 'USD');
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
      amount: plan.price,
      currency: 'USD',
      provider: charge.provider,
      transactionId: charge.transactionId,
      status: charge.status,
    });

    this.logger.log(`User ${userId} subscribed to ${plan.slug}`);
    return { subscription, plan, payment };
  }

  findByUser(userId: string) {
    return this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));
  }

  async findActive(userId: string) {
    const [row] = await this.db
      .select({ subscription: subscriptions, plan: plans })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(this.activeWhere(userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return row ?? null;
  }

  async check(userId: string) {
    const active = await this.findActive(userId);
    return {
      subscribed: !!active,
      subscription: active?.subscription ?? null,
      plan: active?.plan ?? null,
    };
  }

  async cancel(userId: string, id: string) {
    const [cancelled] = await this.db
      .update(subscriptions)
      .set({ active: false, updatedAt: new Date() })
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)))
      .returning();
    if (!cancelled) throw new RpcNotFoundException('Subscription not found');
    this.logger.log(`Subscription cancelled: ${id}`);
    return { message: 'Subscription cancelled', id, subscription: cancelled };
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

  private computeExpiry(period: string, from: Date): Date | null {
    if (period === 'lifetime') return null;
    const d = new Date(from);
    if (period === 'yearly') d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1); // monthly (default)
    return d;
  }
}
