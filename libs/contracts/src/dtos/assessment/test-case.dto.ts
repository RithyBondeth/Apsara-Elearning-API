import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import type { DtoInit } from '../../types/dto-init';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTestCaseRequestDTO {
  @ApiPropertyOptional({ example: '2 3' })
  @IsString()
  @IsOptional()
  input?: string;

  @ApiProperty({ example: '5' })
  @IsString()
  @IsNotEmpty()
  expectedOutput: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isHidden?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class UpdateTestCaseRequestDTO extends PartialType(
  CreateTestCaseRequestDTO,
) {}

export class TestCaseResponseDTO extends CreateTestCaseRequestDTO {
  constructor(partial: DtoInit<TestCaseResponseDTO> = {}) {
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
