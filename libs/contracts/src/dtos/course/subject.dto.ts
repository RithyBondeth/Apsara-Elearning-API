import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import type { DtoInit } from '../../types/dto-init';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSubjectRequestDTO {
  @ApiProperty({ example: 'Mathematics' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'គណិតវិទ្យា' })
  @IsString()
  @IsOptional()
  nameKm?: string;

  @ApiProperty({ example: 'mathematics' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: 'Numbers, algebra, geometry and more' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'ចំណេះដឹងគណិតវិទ្យា' })
  @IsString()
  @IsOptional()
  descriptionKm?: string;

  @ApiPropertyOptional({ example: 'calculator' })
  @IsString()
  @IsOptional()
  icon?: string;
}

export class UpdateSubjectRequestDTO extends PartialType(
  CreateSubjectRequestDTO,
) {}

export class SubjectResponseDTO extends CreateSubjectRequestDTO {
  constructor(partial: DtoInit<SubjectResponseDTO> = {}) {
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
