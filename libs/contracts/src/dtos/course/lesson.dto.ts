import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsInt,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export const LESSON_TYPES = ['article', 'video', 'interactive'] as const;
export type LessonType = (typeof LESSON_TYPES)[number];

export class CreateLessonRequestDTO {
  @ApiProperty({ example: 'Variables and Types' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'variables-and-types' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ enum: LESSON_TYPES, example: 'article' })
  @IsIn(LESSON_TYPES)
  @IsOptional()
  type?: LessonType;

  @ApiPropertyOptional({ example: '# Variables\n...' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ example: 'https://cdn.kodekh.com/lesson.mp4' })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsInt()
  @Min(0)
  @IsOptional()
  estimatedMinutes?: number;
}

export class UpdateLessonRequestDTO extends PartialType(
  CreateLessonRequestDTO,
) {}
