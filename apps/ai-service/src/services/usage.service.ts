import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { aiUsageTracking } from '@app/database/schemas/ai/ai-usage-tracking.schema';
import {
  AiUsageResponseDTO,
  AiUsageSummaryResponseDTO,
  CreditsResponseDTO,
  DRIZZLE,
  IUsageService,
} from '@app/contracts';

/** The allowance counts tokens spent over this many trailing days. */
export const USAGE_WINDOW_DAYS = 30;

const DEFAULT_TOKEN_LIMIT = 1_000_000;

@Injectable()
export class UsageService implements IUsageService {
  private readonly tokenLimit: number;

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    configService: ConfigService,
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
   * Tokens spent in the trailing window against the per-learner limit.
   *
   * A rolling window rather than a lifetime total: a lifetime sum would lock a
   * paying learner out for good once they hit it. Checked before each reply,
   * so one reply can overshoot the limit by at most its own size.
   */
  async checkCredits(userId: string): Promise<CreditsResponseDTO> {
    const since = new Date(Date.now() - USAGE_WINDOW_DAYS * 24 * 60 * 60_000);
    const [row] = await this.db
      .select({
        used: sql<number>`coalesce(sum(${aiUsageTracking.totalTokens}), 0)::int`,
      })
      .from(aiUsageTracking)
      .where(
        and(
          eq(aiUsageTracking.userId, userId),
          gte(aiUsageTracking.createdAt, since),
        ),
      );
    const used = row?.used ?? 0;
    return new CreditsResponseDTO({
      used,
      limit: this.tokenLimit,
      remaining: Math.max(0, this.tokenLimit - used),
      hasCredits: used < this.tokenLimit,
    });
  }
}
