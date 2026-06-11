import { AUTH_SERVICE } from '@app/contracts/constants/services/auth-service.constant';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { rpcCall } from '../utils/rpc-call';
import {
  RegisterRequestDTO,
  RegisterResponseDTO,
  LoginRequestDTO,
  LoginResponseDTO,
} from '@app/contracts';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE.NAME) private readonly authClient: ClientProxy,
  ) {}
  @Post('register')
  register(
    @Body() registerDTO: RegisterRequestDTO,
  ): Promise<RegisterResponseDTO> {
    return rpcCall<RegisterResponseDTO>(
      this.authClient,
      AUTH_SERVICE.ACTIONS.REGISTER,
      registerDTO,
    );
  }

  @Post('login')
  login(@Body() loginDTO: LoginRequestDTO): Promise<LoginResponseDTO> {
    return rpcCall<LoginResponseDTO>(
      this.authClient,
      AUTH_SERVICE.ACTIONS.LOGIN,
      loginDTO,
    );
  }
}
