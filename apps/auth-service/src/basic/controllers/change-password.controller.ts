import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AUTH_SERVICE,
  ChangePasswordPayloadDTO,
  I_PASSWORD_SERVICE,
  MessageResponseDTO,
} from '@app/contracts';
import type {
  IPasswordService,
  IChangePasswordRpcController,
} from '@app/contracts';

@Controller()
export class ChangePasswordController implements IChangePasswordRpcController {
  constructor(
    @Inject(I_PASSWORD_SERVICE)
    private readonly passwordService: IPasswordService,
  ) {}

  @MessagePattern(AUTH_SERVICE.ACTIONS.CHANGE_PASSWORD)
  changePassword(
    @Payload() dto: ChangePasswordPayloadDTO,
  ): Promise<MessageResponseDTO> {
    return this.passwordService.changePassword(dto);
  }
}
