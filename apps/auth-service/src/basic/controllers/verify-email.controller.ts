import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AUTH_SERVICE,
  I_EMAIL_VERIFICATION_SERVICE,
  MessageResponseDTO,
} from '@app/contracts';
import type {
  IEmailVerificationService,
  IVerifyEmailRpcController,
} from '@app/contracts';

@Controller()
export class VerifyEmailController implements IVerifyEmailRpcController {
  constructor(
    @Inject(I_EMAIL_VERIFICATION_SERVICE)
    private readonly emailVerificationService: IEmailVerificationService,
  ) {}

  @MessagePattern(AUTH_SERVICE.ACTIONS.VERIFY_EMAIL)
  verifyEmail(
    @Payload() payload: { token: string },
  ): Promise<MessageResponseDTO> {
    return this.emailVerificationService.verifyEmail(payload.token);
  }
}
