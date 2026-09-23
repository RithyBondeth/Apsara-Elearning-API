import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { DtoInit } from '../../types/dto-init';

/** Default and maximum number of ranked learners returned in one page. */
export const LEADERBOARD_DEFAULT_LIMIT = 20;
export const LEADERBOARD_MAX_LIMIT = 100;

export class LeaderboardQueryDTO {
  @ApiPropertyOptional({
    description: `How many ranked learners to return (max ${LEADERBOARD_MAX_LIMIT})`,
    default: LEADERBOARD_DEFAULT_LIMIT,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LEADERBOARD_MAX_LIMIT)
  @IsOptional()
  limit?: number;
}

/**
 * One row of the XP leaderboard.
 *
 * Deliberately narrow: no email, no full surname. Learners here include
 * children (the platform covers Grade 1–12), so a board visible to other
 * learners exposes a short display name and nothing that identifies them
 * outside the platform.
 */
export class LeaderboardEntryDTO {
  constructor(partial: DtoInit<LeaderboardEntryDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: 1, description: 'Competition rank; ties share a rank' })
  rank: number;

  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  userId: string;

  @ApiProperty({ example: 'Sok D.', description: 'First name plus last initial' })
  displayName: string;

  @ApiPropertyOptional({ example: 'rocket', description: 'Avatar preset key' })
  avatar?: string | null;

  @ApiProperty({ example: 2450 })
  xp: number;

  @ApiProperty({ example: 7 })
  streak: number;

  @ApiProperty({ example: false, description: 'True for the requesting learner' })
  isViewer: boolean;
}

export class LeaderboardResponseDTO {
  constructor(partial: DtoInit<LeaderboardResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ type: [LeaderboardEntryDTO] })
  entries: LeaderboardEntryDTO[];

  @ApiPropertyOptional({
    type: LeaderboardEntryDTO,
    description:
      "The requesting learner's own row, included even when they rank below the returned page. Null for an account excluded from the board.",
  })
  me: LeaderboardEntryDTO | null;

  @ApiProperty({ example: 1280, description: 'Total ranked learners' })
  total: number;
}
