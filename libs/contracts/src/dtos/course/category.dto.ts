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
