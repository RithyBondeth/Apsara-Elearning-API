import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AUTH_SERVICE,
  I_TOKEN_SERVICE,
  RegisterResponseDTO,
} from '@app/contracts';
import type { ITokenService, IRefreshTokenRpcController } from '@app/contracts';

@Controller()
export class RefreshTokenController implements IRefreshTokenRpcController {
  constructor(
    @Inject(I_TOKEN_SERVICE) private readonly tokenService: ITokenService,
  ) {}

  @MessagePattern(AUTH_SERVICE.ACTIONS.REFRESH_TOKEN)
  refresh(
    @Payload() payload: { refreshToken: string },
  ): Promise<RegisterResponseDTO> {
    return this.tokenService.refresh(payload.refreshToken);
  }
}
