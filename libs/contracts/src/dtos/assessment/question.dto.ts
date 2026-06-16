import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateQuestionRequestDTO {
  @ApiProperty({ example: 'What keyword declares a constant in JS?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiPropertyOptional({ example: '`const` creates a read-only binding.' })
  @IsString()
  @IsOptional()
  explanation?: string;

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
