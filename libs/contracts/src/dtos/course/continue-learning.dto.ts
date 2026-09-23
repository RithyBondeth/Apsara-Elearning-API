import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { DtoInit } from '../../types/dto-init';

export const CONTINUE_DEFAULT_LIMIT = 3;
export const CONTINUE_MAX_LIMIT = 20;

export class ContinueLearningQueryDTO {
  @ApiPropertyOptional({
    description: `How many in-progress courses to return (max ${CONTINUE_MAX_LIMIT})`,
    default: CONTINUE_DEFAULT_LIMIT,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(CONTINUE_MAX_LIMIT)
  @IsOptional()
  limit?: number;
}

/** The lesson a learner should land on when they hit "continue". */
export class ContinueLessonDTO {
  constructor(partial: DtoInit<ContinueLessonDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  id: string;

  @ApiProperty({ example: 'variables-and-types' })
  slug: string;

  @ApiProperty({ example: 'Variables and types' })
  title: string;

  @ApiPropertyOptional({
    example: 'Getting started',
    description: 'Title of the module the lesson belongs to',
  })
  moduleTitle?: string | null;
}

/**
 * One "pick up where you left off" card: the course, how far in the learner is,
 * and the next lesson to open.
 */
export class ContinueLearningDTO {
  constructor(partial: DtoInit<ContinueLearningDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  courseId: string;

  @ApiProperty({ example: 'intro-to-javascript' })
  courseSlug: string;

  @ApiProperty({ example: 'Intro to JavaScript' })
  courseTitle: string;

  @ApiPropertyOptional({ example: 'ការណែនាំអំពី JavaScript' })
  courseTitleKm?: string | null;

  @ApiPropertyOptional({ example: 'https://cdn/thumb.png' })
  thumbnail?: string | null;

  @ApiProperty({ example: 45 })
  progressPercent: number;

  @ApiProperty({ example: 12 })
  totalLessons: number;

  @ApiProperty({ example: 5 })
  completedLessons: number;

  @ApiPropertyOptional({
    type: ContinueLessonDTO,
    description:
      'First lesson not yet completed. Null when the course has no lessons.',
  })
  nextLesson: ContinueLessonDTO | null;

  @ApiProperty({
    example: '2026-09-22T10:00:00.000Z',
    description:
      'When the learner last made progress on this course — the ordering key',
  })
  lastActivityAt: Date;
}
