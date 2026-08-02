import { ApiProperty } from '@nestjs/swagger';
import {
  IsByteLength,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ResetPasswordRequestDTO {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsIn...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  token: string;

  @ApiProperty({ example: 'newPassword@123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @IsByteLength(0, 72, { message: 'Password must be at most 72 bytes long' })
  newPassword: string;
}
