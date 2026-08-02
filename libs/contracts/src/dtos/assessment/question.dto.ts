import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export const QUESTION_TYPES = [
  'multiple_choice',
  'true_false',
  'fill_blank',
  'short_answer',
  'matching',
  'numeric',
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export class CreateQuestionRequestDTO {
  @ApiPropertyOptional({ enum: QUESTION_TYPES, example: 'multiple_choice' })
  @IsIn(QUESTION_TYPES)
  @IsOptional()
  type?: QuestionType;

  @ApiProperty({ example: 'What keyword declares a constant in JS?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiPropertyOptional({
    description:
      'Type-specific answer spec. Ignored for multiple_choice (correctness lives on options). ' +
      'Examples — numeric: { "value": 42, "tolerance": 0.5 }; ' +
      'fill_blank/short_answer: { "accepted": ["const"], "caseSensitive": false }; ' +
      'true_false: { "value": true }; ' +
      'matching: { "pairs": [{ "left": "2+2", "right": "4" }] }.',
    example: { value: 42, tolerance: 0.5 },
  })
  @IsObject()
  @IsOptional()
  correctAnswer?: Record<string, unknown>;

  @ApiPropertyOptional({ example: '`const` creates a read-only binding.' })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional({ example: 1, description: 'Weight of this question' })
  @IsInt()
  @Min(1)
  @IsOptional()
  points?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class UpdateQuestionRequestDTO extends PartialType(
  CreateQuestionRequestDTO,
) {}

export class ReorderQuestionsRequestDTO {
  @ApiProperty({ type: [String], example: ['uuid-1', 'uuid-2'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  orderedIds: string[];
}
