import {
  LoginRequestDTO,
  LoginResponseDTO,
  RegisterRequestDTO,
  RegisterResponseDTO,
} from '@app/contracts';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthServiceService {
  async register(
    registerRequestDTO: RegisterRequestDTO,
  ): Promise<RegisterResponseDTO> {
    console.log(registerRequestDTO);
    return {
      message: 'User registered successfully',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };
  }

  async login(loginRequestDTO: LoginRequestDTO): Promise<LoginResponseDTO> {
    console.log(loginRequestDTO);
    return {
      message: 'User logged in successfully',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };
  }
}
