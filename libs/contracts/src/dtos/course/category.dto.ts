import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryRequestDTO {
  @ApiProperty({ example: 'Web Development' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'web-development' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: 'Learn to build modern websites' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'code' })
  @IsString()
  @IsOptional()
  icon?: string;
}

export class UpdateCategoryRequestDTO extends PartialType(
  CreateCategoryRequestDTO,
) {}

export class CategoryResponseDTO extends CreateCategoryRequestDTO {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
