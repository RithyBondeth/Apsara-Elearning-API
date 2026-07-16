import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

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
  @ApiProperty({ example: 'https://cdn.apsaraelearning.com/avatars/abc.png' })
  @IsString()
  @IsNotEmpty()
  avatar: string;
}
