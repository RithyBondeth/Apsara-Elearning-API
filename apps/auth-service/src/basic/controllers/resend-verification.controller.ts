import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AUTH_SERVICE,
  I_EMAIL_VERIFICATION_SERVICE,
  MessageResponseDTO,
} from '@app/contracts';
import type {
  IEmailVerificationService,
  IResendVerificationRpcController,
} from '@app/contracts';

@Controller()
export class ResendVerificationController
  implements IResendVerificationRpcController
{
  constructor(
    @Inject(I_EMAIL_VERIFICATION_SERVICE)
    private readonly emailVerificationService: IEmailVerificationService,
  ) {}

  @MessagePattern(AUTH_SERVICE.ACTIONS.SEND_VERIFICATION_EMAIL)
  resendVerification(
    @Payload() payload: { email: string },
  ): Promise<MessageResponseDTO> {
    return this.emailVerificationService.resendVerification(payload.email);
  }
}
