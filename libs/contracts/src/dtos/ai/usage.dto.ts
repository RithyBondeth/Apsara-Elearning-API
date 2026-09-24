import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { DtoInit } from '../../types/dto-init';

export const USAGE_DEFAULT_LIMIT = 20;
export const USAGE_MAX_LIMIT = 100;

export class AiUsageQueryDTO {
  @ApiPropertyOptional({
    description: `How many recent usage records to return (max ${USAGE_MAX_LIMIT})`,
    default: USAGE_DEFAULT_LIMIT,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(USAGE_MAX_LIMIT)
  @IsOptional()
  limit?: number;
}

/**
 * One recorded AI call.
 *
 * Mirrors `ai_usage_tracking`. The previous shape declared `tokensUsed` and
 * `creditsRemaining`, neither of which is a column — every response carried
 * them as undefined while the real fields went undocumented.
 */
export class AiUsageResponseDTO {
  constructor(partial: DtoInit<AiUsageResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiPropertyOptional({ example: 'tutor', description: 'Which feature spent the tokens' })
  feature?: string | null;

  @ApiPropertyOptional({ example: 120 })
  promptTokens?: number | null;

  @ApiPropertyOptional({ example: 30 })
  completionTokens?: number | null;

  @ApiPropertyOptional({ example: 150 })
  totalTokens?: number | null;

  @ApiPropertyOptional({ example: 'anthropic' })
  provider?: string | null;

  @ApiPropertyOptional({ example: 'claude-sonnet-5' })
  model?: string | null;

  @ApiProperty({ example: '2026-09-24T09:00:00.000Z' })
  createdAt: Date;
}

/** The learner's allowance plus their most recent calls. */
export class AiUsageSummaryResponseDTO {
  constructor(partial: DtoInit<AiUsageSummaryResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: 150, description: 'Tokens spent across every call' })
  used: number;

  @ApiProperty({ example: 1000000 })
  limit: number;

  @ApiProperty({ example: 999850 })
  remaining: number;

  @ApiProperty({ example: true })
  hasCredits: boolean;

  @ApiProperty({
    type: [AiUsageResponseDTO],
    description: 'Most recent calls first, bounded by `limit`',
  })
  recent: AiUsageResponseDTO[];
}

export class CreditsResponseDTO {
  constructor(partial: DtoInit<CreditsResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: 150 })
  used: number;

  @ApiProperty({ example: 1000000 })
  limit: number;

  @ApiProperty({ example: 999850 })
  remaining: number;

  @ApiProperty({ example: true })
  hasCredits: boolean;
}
