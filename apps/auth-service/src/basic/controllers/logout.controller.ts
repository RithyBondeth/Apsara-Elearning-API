import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AUTH_SERVICE,
  I_TOKEN_SERVICE,
  MessageResponseDTO,
} from '@app/contracts';
import type { ITokenService, ILogoutRpcController } from '@app/contracts';

@Controller()
export class LogoutController implements ILogoutRpcController {
  constructor(
    @Inject(I_TOKEN_SERVICE) private readonly tokenService: ITokenService,
  ) {}

  @MessagePattern(AUTH_SERVICE.ACTIONS.LOGOUT)
  logout(@Payload() payload: { userId: string }): Promise<MessageResponseDTO> {
    return this.tokenService.logout(payload.userId);
  }
}
