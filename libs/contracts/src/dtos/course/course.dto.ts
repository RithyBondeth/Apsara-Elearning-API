import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export const COURSE_DIFFICULTIES = [
  'beginner',
  'intermediate',
  'advanced',
] as const;
export type CourseDifficulty = (typeof COURSE_DIFFICULTIES)[number];

export class CreateCourseRequestDTO {
  @ApiProperty({ example: 'Intro to JavaScript' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'intro-to-javascript' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Learn the fundamentals of JavaScript' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://cdn.kodekh.com/js.png' })
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
}

export class UpdateCourseRequestDTO extends PartialType(
  CreateCourseRequestDTO,
) {}
