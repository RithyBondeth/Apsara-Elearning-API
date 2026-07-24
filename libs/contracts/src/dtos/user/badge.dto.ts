import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import type { DtoInit } from '../../types/dto-init';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

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

export class BadgeResponseDTO {
  constructor(partial: DtoInit<BadgeResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  id: string;

  @ApiProperty({ example: 'First Steps' })
  name: string;

  @ApiPropertyOptional({ example: 'Awarded for earning your first 100 XP' })
  description?: string;

  @ApiPropertyOptional({ example: 'trophy' })
  icon?: string;

  @ApiProperty({ example: 100 })
  xpRequired: number;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class UserBadgeResponseDTO {
  constructor(partial: DtoInit<UserBadgeResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  badgeId: string;

  @ApiProperty({ example: 'First Steps' })
  name: string;

  @ApiPropertyOptional({ example: 'Awarded for earning your first 100 XP' })
  description?: string;

  @ApiPropertyOptional({ example: 'trophy' })
  icon?: string;

  @ApiProperty({ example: 100 })
  xpRequired: number;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  earnedAt: Date;
}

export class AwardBadgeResponseDTO {
  constructor(partial: DtoInit<AwardBadgeResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  userId: string;

  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  badgeId: string;

  @ApiPropertyOptional({ example: '2023-01-01T00:00:00.000Z' })
  earnedAt?: Date;

  @ApiPropertyOptional({
    example: false,
    description: 'True when the user already held the badge',
  })
  alreadyOwned?: boolean;
}
