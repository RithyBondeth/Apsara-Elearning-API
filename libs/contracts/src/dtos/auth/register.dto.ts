import { ApiProperty } from '@nestjs/swagger';
import {
  IsByteLength,
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterRequestDTO {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @ApiProperty({ example: 'password@123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @IsByteLength(0, 72, { message: 'Password must be at most 72 bytes long' })
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: 'Male' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['Male', 'Female', 'Other'])
  gender: string;

  @ApiProperty({
    example: '1990-01-01',
    type: String,
    format: 'date',
  })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiProperty({ example: '0123456789' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9+\s-]{8,15}$/)
  phone: string;
}

export class RegisterResponseDTO {
  @ApiProperty({ example: 'User registered successfully' })
  @IsString()
  @IsNotEmpty()
  message: string;

  constructor(partial: Partial<RegisterResponseDTO>) {
    Object.assign(this, partial);
  }
}
