import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class AttemptAnswerDTO {
  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  @IsUUID()
  questionId: string;

  @ApiProperty({ example: '7a2f8f3b-1d3b-5d2f-0g1b-2c3d4e5f6a7b' })
  @IsUUID()
  @IsOptional()
  selectedOptionId?: string;
}

export class AttemptAnswerResponseDTO extends AttemptAnswerDTO {
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
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174999' })
  userId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  quizId: string;

  @ApiProperty({ example: 85.5 })
  score: number;

  @ApiProperty({ type: () => [AttemptAnswerResponseDTO], required: false })
  answers?: AttemptAnswerResponseDTO[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
