import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull, lte, or } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  DRIZZLE,
  ENTITLEMENTS,
  EntitlementKey,
  ResolvedEntitlementDTO,
} from '@app/contracts';
import { planEntitlements } from '@app/database/schemas/subscription/plan-entitlement.schema';
import { subscriptions } from '@app/database/schemas/subscription/subscription.schema';
import { userEntitlementGrants } from '@app/database/schemas/subscription/user-entitlement-grant.schema';
import { RpcForbiddenException } from '../filters/rpc-exceptions';

@Injectable()
export class EntitlementService {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

  async has(userId: string, entitlement: EntitlementKey): Promise<boolean> {
    return (await this.resolveOne(userId, entitlement)).granted;
  }

  async assert(userId: string, entitlement: EntitlementKey): Promise<void> {
    if (!(await this.has(userId, entitlement))) {
      throw new RpcForbiddenException(`Entitlement required: ${entitlement}`);
    }
  }

  async resolveAll(userId: string): Promise<ResolvedEntitlementDTO[]> {
    return Promise.all(ENTITLEMENTS.map((key) => this.resolveOne(userId, key)));
  }

  private async resolveOne(
    userId: string,
    entitlement: EntitlementKey,
  ): Promise<ResolvedEntitlementDTO> {
    const now = new Date();
    const grantWindow = and(
      eq(userEntitlementGrants.userId, userId),
      eq(userEntitlementGrants.entitlement, entitlement),
      isNull(userEntitlementGrants.revokedAt),
      or(
        isNull(userEntitlementGrants.startsAt),
        lte(userEntitlementGrants.startsAt, now),
      ),
      or(
        isNull(userEntitlementGrants.expiresAt),
        gt(userEntitlementGrants.expiresAt, now),
      ),
    );

    const [deny] = await this.db
      .select({ expiresAt: userEntitlementGrants.expiresAt })
      .from(userEntitlementGrants)
      .where(and(grantWindow, eq(userEntitlementGrants.effect, 'deny')))
      .limit(1);
    if (deny)
      return new ResolvedEntitlementDTO({
        entitlement,
        granted: false,
        source: 'administrative',
        validUntil: deny.expiresAt,
      });

    const [allow] = await this.db
      .select({ expiresAt: userEntitlementGrants.expiresAt })
      .from(userEntitlementGrants)
      .where(and(grantWindow, eq(userEntitlementGrants.effect, 'allow')))
      .limit(1);
    if (allow)
      return new ResolvedEntitlementDTO({
        entitlement,
        granted: true,
        source: 'administrative',
        validUntil: allow.expiresAt,
      });

    const [plan] = await this.db
      .select({
        expiresAt: subscriptions.expiresAt,
        graceEndsAt: subscriptions.graceEndsAt,
        trialEndsAt: subscriptions.trialEndsAt,
      })
      .from(subscriptions)
      .innerJoin(
        planEntitlements,
        eq(subscriptions.planId, planEntitlements.planId),
      )
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.active, true),
          eq(planEntitlements.entitlement, entitlement),
          or(isNull(subscriptions.startsAt), lte(subscriptions.startsAt, now)),
          or(
            gt(subscriptions.graceEndsAt, now),
            and(
              eq(subscriptions.status, 'trialing'),
              gt(subscriptions.trialEndsAt, now),
            ),
            and(
              eq(subscriptions.status, 'active'),
              or(
                isNull(subscriptions.expiresAt),
                gt(subscriptions.expiresAt, now),
              ),
            ),
          ),
        ),
      )
      .limit(1);
    if (plan) {
      const validUntil =
        plan.graceEndsAt && plan.graceEndsAt > now
          ? plan.graceEndsAt
          : plan.trialEndsAt && plan.trialEndsAt > now
            ? plan.trialEndsAt
            : plan.expiresAt;
      return new ResolvedEntitlementDTO({
        entitlement,
        granted: true,
        source: 'plan',
        validUntil,
      });
    }
    return new ResolvedEntitlementDTO({
      entitlement,
      granted: false,
      source: 'none',
      validUntil: null,
    });
  }
}
