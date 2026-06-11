import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { RegisterResponseDTO } from './register.dto';
import { ApiProperty } from '@nestjs/swagger';

export class LoginRequestDTO {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password@123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class LoginResponseDTO extends RegisterResponseDTO {}
