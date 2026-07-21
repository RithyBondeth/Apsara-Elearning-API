import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, sql } from 'drizzle-orm';
import { aiUsageTracking } from '@app/database/schemas/ai/ai-usage-tracking.schema';
import { DRIZZLE } from '@app/contracts';

/** Simple per-user token allowance (until a real plan/credits system exists). */
const TOKEN_LIMIT = 1_000_000;

@Injectable()
export class UsageService {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

  findByUser(userId: string) {
    return this.db
      .select()
      .from(aiUsageTracking)
      .where(eq(aiUsageTracking.userId, userId))
      .orderBy(aiUsageTracking.createdAt);
  }

  async checkCredits(userId: string) {
    const [row] = await this.db
      .select({
        used: sql<number>`coalesce(sum(${aiUsageTracking.totalTokens}), 0)::int`,
      })
      .from(aiUsageTracking)
      .where(eq(aiUsageTracking.userId, userId));
    const used = row?.used ?? 0;
    return {
      used,
      limit: TOKEN_LIMIT,
      remaining: Math.max(0, TOKEN_LIMIT - used),
      hasCredits: used < TOKEN_LIMIT,
    };
  }
}
