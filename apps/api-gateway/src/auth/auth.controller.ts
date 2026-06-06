import { AUTH_SERVICE } from '@app/contracts/constants/services/auth-service.constant';
import { Body, Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { rpcCall } from '../utils/rpc-call';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE.NAME) private readonly authClient: ClientProxy,
  ) {}

  @Get('ping')
  ping() {
    return rpcCall(this.authClient, AUTH_SERVICE.ACTIONS.PING, {});
  }
}
