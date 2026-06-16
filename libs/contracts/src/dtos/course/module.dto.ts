import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateModuleRequestDTO {
  @ApiProperty({ example: 'Getting Started' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Setup and the basics' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class UpdateModuleRequestDTO extends PartialType(
  CreateModuleRequestDTO,
) {}
