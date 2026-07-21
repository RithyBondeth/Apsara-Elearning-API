import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AUTH_SERVICE,
  I_REGISTER_SERVICE,
  RegisterRequestDTO,
  RegisterResponseDTO,
} from '@app/contracts';
import type {
  IRegisterService,
  IRegisterRpcController,
} from '@app/contracts';

@Controller()
export class RegisterController implements IRegisterRpcController {
  constructor(
    @Inject(I_REGISTER_SERVICE)
    private readonly registerService: IRegisterService,
  ) {}

  @MessagePattern(AUTH_SERVICE.ACTIONS.REGISTER)
  register(
    @Payload() registerDTO: RegisterRequestDTO,
  ): Promise<RegisterResponseDTO> {
    return this.registerService.register(registerDTO);
  }
}
