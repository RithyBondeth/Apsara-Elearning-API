import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AUTH_SERVICE,
  I_LOGIN_SERVICE,
  LoginRequestDTO,
  LoginResponseDTO,
} from '@app/contracts';
import type { ILoginService, ILoginRpcController } from '@app/contracts';

@Controller()
export class LoginController implements ILoginRpcController {
  constructor(
    @Inject(I_LOGIN_SERVICE) private readonly loginService: ILoginService,
  ) {}

  @MessagePattern(AUTH_SERVICE.ACTIONS.LOGIN)
  login(@Payload() loginDTO: LoginRequestDTO): Promise<LoginResponseDTO> {
    return this.loginService.login(loginDTO);
  }
}
