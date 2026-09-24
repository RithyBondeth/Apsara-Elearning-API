import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { DtoInit } from '../../types/dto-init';

export const RATINGS_DEFAULT_LIMIT = 10;
export const RATINGS_MAX_LIMIT = 50;
export const REVIEW_MAX_LENGTH = 2000;

export class RatingQueryDTO {
  @ApiPropertyOptional({
    description: `How many written reviews to return (max ${RATINGS_MAX_LIMIT})`,
    default: RATINGS_DEFAULT_LIMIT,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(RATINGS_MAX_LIMIT)
  @IsOptional()
  limit?: number;
}

export class UpsertRatingRequestDTO {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    example: 'Clear explanations and the exercises actually helped.',
    maxLength: REVIEW_MAX_LENGTH,
  })
  @IsString()
  @MaxLength(REVIEW_MAX_LENGTH)
  @IsOptional()
  review?: string;
}

/**
 * A published review.
 *
 * Carries a first name plus last initial and never an email — the same rule the
 * leaderboard follows, and for the same reason: this platform teaches Grade
 * 1–12, and a course page is readable by anyone.
 */
export class RatingResponseDTO {
  constructor(partial: DtoInit<RatingResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  id: string;

  @ApiProperty({ example: 5 })
  rating: number;

  @ApiPropertyOptional({ example: 'Clear explanations.' })
  review?: string | null;

  @ApiProperty({ example: 'Sok D.', description: 'First name plus last initial' })
  displayName: string;

  @ApiPropertyOptional({ example: 'rocket' })
  avatar?: string | null;

  @ApiProperty({ example: '2026-09-24T09:00:00.000Z' })
  createdAt: Date;
}

export class RatingSummaryResponseDTO {
  constructor(partial: DtoInit<RatingSummaryResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiPropertyOptional({
    example: 4.6,
    description:
      'Mean rating to one decimal place. Null when nothing has been rated — never 0, so a client cannot render an unrated course as a zero-star one.',
    nullable: true,
  })
  average: number | null;

  @ApiProperty({ example: 27, description: 'How many learners have rated' })
  count: number;

  @ApiProperty({
    example: { '1': 0, '2': 1, '3': 2, '4': 8, '5': 16 },
    description: 'How many ratings fell on each star, for the breakdown bars',
  })
  distribution: Record<string, number>;

  @ApiProperty({
    type: [RatingResponseDTO],
    description: 'Most recent written reviews first; ratings with no text are excluded',
  })
  items: RatingResponseDTO[];
}
