import {
  IsEmail,
  IsNotEmpty,
  IsString,
} from 'class-validator/types/decorator/decorators';
import { RegisterResponseDTO } from './register.dto';

export class LoginDTO {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class LoginResponseDTO extends RegisterResponseDTO {}
