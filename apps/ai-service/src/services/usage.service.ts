import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { desc, eq, sql } from 'drizzle-orm';
import { aiUsageTracking } from '@app/database/schemas/ai/ai-usage-tracking.schema';
import {
  AiUsageResponseDTO,
  AiUsageSummaryResponseDTO,
  CreditsResponseDTO,
  DRIZZLE,
  IUsageService,
} from '@app/contracts';

/** Simple per-user token allowance (until a real plan/credits system exists). */
const TOKEN_LIMIT = 1_000_000;

@Injectable()
export class UsageService implements IUsageService {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

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

  async checkCredits(userId: string): Promise<CreditsResponseDTO> {
    const [row] = await this.db
      .select({
        used: sql<number>`coalesce(sum(${aiUsageTracking.totalTokens}), 0)::int`,
      })
      .from(aiUsageTracking)
      .where(eq(aiUsageTracking.userId, userId));
    const used = row?.used ?? 0;
    return new CreditsResponseDTO({
      used,
      limit: TOKEN_LIMIT,
      remaining: Math.max(0, TOKEN_LIMIT - used),
      hasCredits: used < TOKEN_LIMIT,
    });
  }
}
