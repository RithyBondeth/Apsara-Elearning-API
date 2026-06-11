import {
  LoginRequestDTO,
  LoginResponseDTO,
  RegisterRequestDTO,
  RegisterResponseDTO,
} from '@app/contracts';
import { AUTH_SERVICE } from '@app/contracts/constants/services/auth-service.constant';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthServiceService } from './auth-service.service';

@Controller()
export class AuthServiceController {
  constructor(private readonly authService: AuthServiceService) {}

  @MessagePattern(AUTH_SERVICE.ACTIONS.REGISTER)
  register(
    @Payload() registerDTO: RegisterRequestDTO,
  ): Promise<RegisterResponseDTO> {
    return this.authService.register(registerDTO);
  }

  @MessagePattern(AUTH_SERVICE.ACTIONS.LOGIN)
  login(@Payload() loginDTO: LoginRequestDTO): Promise<LoginResponseDTO> {
    return this.authService.login(loginDTO);
  }
}
