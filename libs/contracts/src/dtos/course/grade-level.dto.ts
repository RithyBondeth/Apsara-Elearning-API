import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import type { DtoInit } from '../../types/dto-init';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export const EDUCATION_STAGES = [
  'primary',
  'lower_secondary',
  'upper_secondary',
] as const;
export type EducationStage = (typeof EDUCATION_STAGES)[number];

export class CreateGradeLevelRequestDTO {
  @ApiProperty({ enum: EDUCATION_STAGES, example: 'lower_secondary' })
  @IsIn(EDUCATION_STAGES)
  stage: EducationStage;

  @ApiProperty({ example: 7, minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  grade: number;

  @ApiProperty({ example: 'Grade 7' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'ថ្នាក់ទី៧' })
  @IsString()
  @IsOptional()
  nameKm?: string;

  @ApiPropertyOptional({ example: 7 })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class UpdateGradeLevelRequestDTO extends PartialType(
  CreateGradeLevelRequestDTO,
) {}

export class GradeLevelResponseDTO extends CreateGradeLevelRequestDTO {
  constructor(partial: DtoInit<GradeLevelResponseDTO> = {}) {
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
