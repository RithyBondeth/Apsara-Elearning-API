import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { DtoInit } from '../../types/dto-init';
import { BadgeResponseDTO } from './badge.dto';

/**
 * Public projection of a user — mirrors the `publicColumns` selection in
 * user-service; never carries password, tokens, or OTPs.
 */
export class UserResponseDTO {
  constructor(partial: DtoInit<UserResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  id: string;

  @ApiPropertyOptional({ example: 'John' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  lastName?: string;

  @ApiPropertyOptional({ example: 'Male' })
  gender?: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'rocket' })
  avatar?: string;

  @ApiProperty({ example: 3 })
  streak: number;

  @ApiProperty({ example: 1200 })
  xp: number;

  @ApiProperty({ example: false })
  isAdmin: boolean;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: true })
  isEmailVerified: boolean;

  @ApiPropertyOptional({ example: '0123456789' })
  phone?: string;

  @ApiPropertyOptional({ example: '2023-01-01T00:00:00.000Z' })
  lastLoginAt?: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

/** Result of an XP grant: the updated user plus any newly-earned badges. */
export class AddXpResponseDTO {
  constructor(partial: DtoInit<AddXpResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ type: UserResponseDTO })
  user: UserResponseDTO;

  @ApiProperty({ type: [BadgeResponseDTO] })
  awardedBadges: BadgeResponseDTO[];
}
