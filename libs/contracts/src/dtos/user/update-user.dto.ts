import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AVATAR_PRESETS } from '../../constants/domain/avatar.constant';
import type { TAvatarPreset } from '../../constants/domain/avatar.constant';

export class UpdateUserRequestDTO {
  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Male' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ example: '0123456789' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;
}

export class UpdateAvatarRequestDTO {
  @ApiProperty({
    description: 'Key of a built-in avatar the student picked',
    enum: AVATAR_PRESETS,
    example: 'rocket',
  })
  @IsIn(AVATAR_PRESETS)
  @IsNotEmpty()
  avatar: TAvatarPreset;
}

/**
 * What an admin can change on another account. Every field is optional; only
 * the ones sent are applied.
 */
export class AdminUpdateUserRequestDTO {
  @ApiPropertyOptional({
    example: true,
    description: 'Grant or remove admin access',
  })
  @IsBoolean()
  @IsOptional()
  isAdmin?: boolean;

  @ApiPropertyOptional({
    example: false,
    description:
      'Suspend (blocks login and session refresh) or reinstate the account',
  })
  @IsBoolean()
  @IsOptional()
  suspended?: boolean;

  @ApiPropertyOptional({ example: 'Sokha' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Chan' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  lastName?: string;
}
