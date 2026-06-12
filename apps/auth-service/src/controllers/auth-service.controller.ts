import {
  LoginRequestDTO,
  LoginResponseDTO,
  RegisterRequestDTO,
  RegisterResponseDTO,
} from '@app/contracts';
import { AUTH_SERVICE } from '@app/contracts/constants/services/auth-service.constant';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RegisterService } from '../services/register.service';
import { LoginService } from '../services/login.service';

@Controller()
export class AuthServiceController {
  constructor(
    private readonly registerService: RegisterService,
    private readonly loginService: LoginService,
  ) {}

  @MessagePattern(AUTH_SERVICE.ACTIONS.REGISTER)
  register(
    @Payload() registerDTO: RegisterRequestDTO,
  ): Promise<RegisterResponseDTO> {
    return this.registerService.register(registerDTO);
  }

  @MessagePattern(AUTH_SERVICE.ACTIONS.LOGIN)
  login(@Payload() loginDTO: LoginRequestDTO): Promise<LoginResponseDTO> {
    return this.loginService.login(loginDTO);
  }
}
