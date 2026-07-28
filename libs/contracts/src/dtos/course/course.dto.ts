import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import type { DtoInit } from '../../types/dto-init';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export const COURSE_DIFFICULTIES = [
  'beginner',
  'intermediate',
  'advanced',
] as const;
export type CourseDifficulty = (typeof COURSE_DIFFICULTIES)[number];

export const PROGRAM_TYPES = ['k12', 'university', 'programming'] as const;
export type ProgramType = (typeof PROGRAM_TYPES)[number];

export class CreateCourseRequestDTO {
  @ApiPropertyOptional({ enum: PROGRAM_TYPES, example: 'k12' })
  @IsIn(PROGRAM_TYPES)
  @IsOptional()
  programType?: ProgramType;

  @ApiProperty({ example: 'Grade 7 Mathematics' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'គណិតវិទ្យា ថ្នាក់ទី៧' })
  @IsString()
  @IsOptional()
  titleKm?: string;

  @ApiProperty({ example: 'grade-7-mathematics' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({
    description: 'Subject (K–12 placement)',
    example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a',
  })
  @IsUUID()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional({
    description: 'Grade level (K–12 placement)',
    example: '7a2f8f3b-1d3b-5d2f-0f1b-2c3d4e5f6a7b',
  })
  @IsUUID()
  @IsOptional()
  gradeLevelId?: string;

  @ApiPropertyOptional({
    description: 'Major (university placement)',
    example: '8b3f9f4c-2e4c-6e3f-1f2c-3d4e5f6a7b8c',
  })
  @IsUUID()
  @IsOptional()
  majorId?: string;

  @ApiPropertyOptional({
    description: 'Programming category (programming placement)',
    example: '9c4a0a5d-3f5d-7f4a-2a3d-4e5f6a7b8c9d',
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Learn the fundamentals of algebra' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'រៀនមូលដ្ឋានគ្រឹះនៃពិជគណិត' })
  @IsString()
  @IsOptional()
  descriptionKm?: string;

  @ApiPropertyOptional({ example: 'https://cdn.apsaraelearning.com/math7.png' })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiPropertyOptional({ enum: COURSE_DIFFICULTIES, example: 'beginner' })
  @IsIn(COURSE_DIFFICULTIES)
  @IsOptional()
  difficulty?: CourseDifficulty;

  @ApiPropertyOptional({ example: 10 })
  @IsInt()
  @Min(0)
  @IsOptional()
  estimatedHours?: number;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether lesson content requires an active subscription',
  })
  @IsBoolean()
  @IsOptional()
  requiresSubscription?: boolean;
}

export class UpdateCourseRequestDTO extends PartialType(
  CreateCourseRequestDTO,
) {}

/**
 * Keyword search over published courses, with optional taxonomy filters and
 * pagination. Query params arrive as strings, so numeric fields are coerced.
 */
export class SearchCoursesRequestDTO {
  @ApiPropertyOptional({
    description: 'Keyword matched against course title / description',
    example: 'algebra',
  })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ enum: PROGRAM_TYPES, example: 'k12' })
  @IsIn(PROGRAM_TYPES)
  @IsOptional()
  programType?: ProgramType;

  @ApiPropertyOptional({ description: 'Filter by subject (K–12)' })
  @IsUUID()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Filter by grade level (K–12)' })
  @IsUUID()
  @IsOptional()
  gradeLevelId?: string;

  @ApiPropertyOptional({ description: 'Filter by major (university)' })
  @IsUUID()
  @IsOptional()
  majorId?: string;

  @ApiPropertyOptional({ description: 'Filter by programming category' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 20, default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ example: 0, default: 0, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number;
}

export class CourseResponseDTO extends CreateCourseRequestDTO {
  constructor(partial: DtoInit<CourseResponseDTO> = {}) {
    super();
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
