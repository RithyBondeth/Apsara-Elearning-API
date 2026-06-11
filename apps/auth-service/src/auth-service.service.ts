import {
  LoginDTO,
  LoginResponseDTO,
  RegisterDTO,
  RegisterResponseDTO,
} from '@app/contracts';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthServiceService {
  async register(registerDTO: RegisterDTO): Promise<RegisterResponseDTO> {
    console.log(registerDTO);
    return {
      message: 'User registered successfully',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };
  }

  async login(loginDTO: LoginDTO): Promise<LoginResponseDTO> {
    console.log(loginDTO);
    return {
      message: 'User logged in successfully',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };
  }
}
