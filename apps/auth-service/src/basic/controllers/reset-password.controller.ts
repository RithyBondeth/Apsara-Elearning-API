import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AUTH_SERVICE,
  I_PASSWORD_SERVICE,
  MessageResponseDTO,
  ResetPasswordRequestDTO,
} from '@app/contracts';
import type {
  IPasswordService,
  IResetPasswordRpcController,
} from '@app/contracts';

@Controller()
export class ResetPasswordController implements IResetPasswordRpcController {
  constructor(
    @Inject(I_PASSWORD_SERVICE)
    private readonly passwordService: IPasswordService,
  ) {}

  @MessagePattern(AUTH_SERVICE.ACTIONS.RESET_PASSWORD)
  resetPassword(
    @Payload() dto: ResetPasswordRequestDTO,
  ): Promise<MessageResponseDTO> {
    return this.passwordService.resetPassword(dto);
  }
}
