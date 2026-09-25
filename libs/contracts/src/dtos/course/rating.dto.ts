import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
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
/** How many featured reviews the landing page shows at most. */
export const FEATURED_REVIEWS_LIMIT = 6;
/** Moderation list size — written reviews only, newest first. */
export const ADMIN_REVIEWS_LIMIT = 200;
/**
 * Seeded demo accounts use this email domain (see scripts/seed.mjs). In
 * production they are excluded from every public review figure, so demo data
 * can never reach real visitors even if it was seeded by mistake.
 */
export const DEMO_EMAIL_DOMAIN = 'apsara-elearning.test';

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

  @ApiProperty({
    example: 'Sok D.',
    description: 'First name plus last initial',
  })
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
    description:
      'Most recent written reviews first; ratings with no text are excluded',
  })
  items: RatingResponseDTO[];
}

/** A featured review plus the course it is about, for the landing page. */
export class FeaturedReviewDTO extends RatingResponseDTO {
  constructor(partial: DtoInit<FeaturedReviewDTO> = {}) {
    super();
    Object.assign(this, partial);
  }

  @ApiProperty({ example: 'Grade 12 Chemistry' })
  courseTitle: string;

  @ApiPropertyOptional({ example: 'គីមីវិទ្យា ថ្នាក់ទី១២' })
  courseTitleKm?: string | null;

  @ApiProperty({ example: 'chemistry' })
  courseSlug: string;
}

/**
 * Landing-page reviews. `average` and `count` cover every rating on published
 * courses — not just the featured ones — so curating quotes cannot hide a low
 * overall score.
 */
export class FeaturedReviewsResponseDTO {
  constructor(partial: DtoInit<FeaturedReviewsResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiPropertyOptional({ example: 4.7, nullable: true })
  average: number | null;

  @ApiProperty({ example: 38 })
  count: number;

  @ApiProperty({ type: [FeaturedReviewDTO] })
  items: FeaturedReviewDTO[];
}

/** A written review as the moderation list shows it. */
export class AdminReviewDTO {
  constructor(partial: DtoInit<AdminReviewDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty() id: string;
  @ApiProperty({ example: 5 }) rating: number;
  @ApiProperty() review: string;
  @ApiProperty() featured: boolean;
  @ApiProperty({ example: 'Sok D.' }) displayName: string;
  @ApiProperty({ example: 'sok@example.com' }) email: string;
  @ApiProperty() courseTitle: string;
  @ApiProperty() updatedAt: Date;
}

export class SetReviewFeaturedRequestDTO {
  @ApiProperty({ example: true })
  @IsBoolean()
  featured: boolean;
}
