import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, sql } from 'drizzle-orm';
import { aiUsageTracking } from '@app/database/schemas/ai/ai-usage-tracking.schema';
import {
  AiUsageResponseDTO,
  CreditsResponseDTO,
  DRIZZLE,
  IUsageService,
} from '@app/contracts';

/** Simple per-user token allowance (until a real plan/credits system exists). */
const TOKEN_LIMIT = 1_000_000;

@Injectable()
export class UsageService implements IUsageService {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

  async findByUser(userId: string): Promise<AiUsageResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(aiUsageTracking)
      .where(eq(aiUsageTracking.userId, userId))
      .orderBy(aiUsageTracking.createdAt);
    return rows.map((row) => new AiUsageResponseDTO(row));
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
