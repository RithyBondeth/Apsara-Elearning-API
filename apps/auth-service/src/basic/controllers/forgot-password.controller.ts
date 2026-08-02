import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AUTH_SERVICE,
  ForgotPasswordRequestDTO,
  I_PASSWORD_SERVICE,
  MessageResponseDTO,
} from '@app/contracts';
import type {
  IPasswordService,
  IForgotPasswordRpcController,
} from '@app/contracts';

@Controller()
export class ForgotPasswordController implements IForgotPasswordRpcController {
  constructor(
    @Inject(I_PASSWORD_SERVICE)
    private readonly passwordService: IPasswordService,
  ) {}

  @MessagePattern(AUTH_SERVICE.ACTIONS.FORGOT_PASSWORD)
  forgotPassword(
    @Payload() dto: ForgotPasswordRequestDTO,
  ): Promise<MessageResponseDTO> {
    return this.passwordService.forgotPassword(dto);
  }
}
