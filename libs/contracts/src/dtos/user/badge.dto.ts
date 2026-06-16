import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBadgeRequestDTO {
  @ApiProperty({ example: 'First Steps' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Awarded for earning your first 100 XP' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'trophy' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsInt()
  @Min(0)
  @IsOptional()
  xpRequired?: number;
}

export class UpdateBadgeRequestDTO extends PartialType(CreateBadgeRequestDTO) {}
