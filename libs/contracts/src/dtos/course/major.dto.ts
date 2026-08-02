import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import type { DtoInit } from '../../types/dto-init';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMajorRequestDTO {
  @ApiProperty({ example: 'Computer Science' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'វិទ្យាសាស្ត្រកុំព្យូទ័រ' })
  @IsString()
  @IsOptional()
  nameKm?: string;

  @ApiProperty({ example: 'computer-science' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  @IsUUID()
  @IsOptional()
  facultyId?: string;

  @ApiPropertyOptional({ example: 'Software, algorithms and systems' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateMajorRequestDTO extends PartialType(CreateMajorRequestDTO) {}

export class MajorResponseDTO extends CreateMajorRequestDTO {
  constructor(partial: DtoInit<MajorResponseDTO> = {}) {
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
