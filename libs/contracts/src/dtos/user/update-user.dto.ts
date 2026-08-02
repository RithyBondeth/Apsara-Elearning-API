import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
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
