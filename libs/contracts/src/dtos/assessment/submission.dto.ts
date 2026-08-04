import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { DtoInit } from '../../types/dto-init';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSubmissionRequestDTO {
  @ApiProperty({
    example: 'const [a,b]=input.split(" ").map(Number);console.log(a+b)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  sourceCode: string;

  @ApiProperty({ example: 'javascript' })
  @IsString()
  @IsNotEmpty()
  language: string;
}

export class SubmissionResponseDTO extends CreateSubmissionRequestDTO {
  constructor(partial: DtoInit<SubmissionResponseDTO> = {}) {
    super();
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174001' })
  challengeId?: string;

  @ApiPropertyOptional({ example: true })
  passed?: boolean;

  @ApiPropertyOptional({ example: 100 })
  score?: number | null;

  @ApiPropertyOptional({ example: 4 })
  testCasesPassed?: number | null;

  @ApiPropertyOptional({ example: 5 })
  testCasesTotal?: number | null;

  @ApiPropertyOptional({ example: 128 })
  executionTimeMs?: number | null;

  @ApiPropertyOptional({ example: 'ReferenceError: x is not defined' })
  errorMessage?: string | null;

  /* Joined so a submission list can name what was attempted without one
     request per row. */
  @ApiPropertyOptional({ example: 'Two Sum' })
  challengeTitle?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174002' })
  lessonId?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
