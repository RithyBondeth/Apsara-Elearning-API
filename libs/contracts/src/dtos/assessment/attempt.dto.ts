import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { DtoInit } from '../../types/dto-init';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsObject,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class AttemptAnswerDTO {
  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  @IsUUID()
  questionId: string;

  @ApiPropertyOptional({
    description: 'Selected option (choice-based questions)',
    example: '7a2f8f3b-1d3b-5d2f-0f1b-2c3d4e5f6a7b',
  })
  @IsUUID()
  @IsOptional()
  selectedOptionId?: string;

  @ApiPropertyOptional({
    description:
      'Raw answer for non-choice questions. Examples — numeric: { "value": 42 }; ' +
      'fill_blank/short_answer: { "text": "const" }; ' +
      'true_false: { "value": true }; ' +
      'matching: { "pairs": [{ "left": "2+2", "right": "4" }] }.',
    example: { value: 42 },
  })
  @IsObject()
  @IsOptional()
  answerData?: Record<string, unknown>;
}

export class AttemptAnswerResponseDTO extends AttemptAnswerDTO {
  constructor(partial: DtoInit<AttemptAnswerResponseDTO> = {}) {
    super();
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;
}

export class SubmitAttemptRequestDTO {
  @ApiProperty({ type: [AttemptAnswerDTO] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AttemptAnswerDTO)
  answers: AttemptAnswerDTO[];
}

export class AttemptResponseDTO {
  constructor(partial: DtoInit<AttemptResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174999' })
  userId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  quizId: string;

  @ApiProperty({ example: 85.5 })
  score: number;

  @ApiPropertyOptional({ example: 6 })
  totalQuestions?: number;

  @ApiPropertyOptional({ example: 5 })
  correctAnswers?: number;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z' })
  completedAt?: Date | null;

  /* Joined labels. A history list showing "85% on <uuid>" is useless, and
     resolving these client-side would be one request per attempt. */
  @ApiPropertyOptional({ example: 'Derivatives — practice' })
  quizTitle?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174002' })
  lessonId?: string;

  @ApiPropertyOptional({ example: 'Rules of differentiation' })
  lessonTitle?: string;

  @ApiPropertyOptional({ example: 'grade-12-mathematics' })
  courseSlug?: string;

  @ApiProperty({ type: () => [AttemptAnswerResponseDTO], required: false })
  answers?: AttemptAnswerResponseDTO[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
