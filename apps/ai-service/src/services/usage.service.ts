import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, count, desc, eq, gte, sql } from 'drizzle-orm';
import { aiUsageTracking } from '@app/database/schemas/ai/ai-usage-tracking.schema';
import {
  AiUsageResponseDTO,
  AiUsageSummaryResponseDTO,
  CreditsResponseDTO,
  DRIZZLE,
  IUsageService,
} from '@app/contracts';
import { EntitlementService } from '@app/common';

/** The allowance counts tokens spent over this many trailing days. */
export const USAGE_WINDOW_DAYS = 30;

const DEFAULT_TOKEN_LIMIT = 1_000_000;

@Injectable()
export class UsageService implements IUsageService {
  private readonly tokenLimit: number;

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    configService: ConfigService,
    private readonly entitlements: EntitlementService,
  ) {
    this.tokenLimit =
      configService.get<number>('ai.monthlyTokenLimit') ?? DEFAULT_TOKEN_LIMIT;
  }

  /**
   * The learner's allowance plus their most recent calls.
   *
   * Newest first and bounded: the previous version returned every row this
   * account had ever generated, ascending, which grows without limit and puts
   * the least interesting records first.
   */
  async findByUser(
    userId: string,
    limit: number,
  ): Promise<AiUsageSummaryResponseDTO> {
    const rows = await this.db
      .select()
      .from(aiUsageTracking)
      .where(eq(aiUsageTracking.userId, userId))
      .orderBy(desc(aiUsageTracking.createdAt))
      .limit(limit);

    const credits = await this.checkCredits(userId);

    return new AiUsageSummaryResponseDTO({
      ...credits,
      recent: rows.map((row) => new AiUsageResponseDTO(row)),
    });
  }

  /**
   * The learner's two allowances, checked before every reply:
   *
   * - Replies: what their plan's `ai_credits` allows per billing period (one
   *   credit = one tutor reply), counted from the start of the current period
   *   so it resets at each renewal. Access granted by an admin, or a plan with
   *   0 credits, has no per-reply limit.
   * - Tokens: a rolling 30-day cap for everyone — the abuse backstop. A
   *   lifetime sum would lock a paying learner out for good.
   *
   * Checked before each reply, so one reply can overshoot by its own size.
   */
  async checkCredits(userId: string): Promise<CreditsResponseDTO> {
    const now = Date.now();
    const windowStart = new Date(now - USAGE_WINDOW_DAYS * 24 * 60 * 60_000);
    const [row] = await this.db
      .select({
        used: sql<number>`coalesce(sum(${aiUsageTracking.totalTokens}), 0)::int`,
      })
      .from(aiUsageTracking)
      .where(
        and(
          eq(aiUsageTracking.userId, userId),
          gte(aiUsageTracking.createdAt, windowStart),
        ),
      );
    const used = row?.used ?? 0;
    const tokensLeft = used < this.tokenLimit;

    const grant = await this.entitlements.activePlanGrant(userId, 'ai:tutor');
    const repliesLimit = grant && grant.aiCredits > 0 ? grant.aiCredits : null;
    // Without a provider-reported period (e.g. a hand-made subscription),
    // fall back to the same rolling window as the token cap.
    const periodStart = grant?.periodStart ?? windowStart;
    const [replies] = await this.db
      .select({ n: count() })
      .from(aiUsageTracking)
      .where(
        and(
          eq(aiUsageTracking.userId, userId),
          eq(aiUsageTracking.feature, 'chat'),
          gte(aiUsageTracking.createdAt, periodStart),
        ),
      );
    const repliesUsed = Number(replies?.n ?? 0);
    const repliesLeft = repliesLimit === null || repliesUsed < repliesLimit;

    return new CreditsResponseDTO({
      used,
      limit: this.tokenLimit,
      remaining: Math.max(0, this.tokenLimit - used),
      hasCredits: tokensLeft && repliesLeft,
      repliesUsed,
      repliesLimit,
      repliesRemaining:
        repliesLimit === null ? null : Math.max(0, repliesLimit - repliesUsed),
      periodEndsAt: repliesLimit === null ? null : (grant?.periodEnd ?? null),
      exhausted: !repliesLeft ? 'replies' : !tokensLeft ? 'tokens' : null,
    });
  }
}
