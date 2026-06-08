import { USER_SERVICE } from '@app/contracts/constants/services/user-service.constant';
import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { rpcCall } from '../utils/rpc-call';

@Controller('user')
export class UserController {
  constructor(
    @Inject(USER_SERVICE.NAME) private readonly userClient: ClientProxy,
  ) {}

  @Get('ping')
  ping() {
    return rpcCall(this.userClient, USER_SERVICE.ACTIONS.PING, {});
  }
}
