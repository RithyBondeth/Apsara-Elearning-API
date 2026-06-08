import { Controller, Delete, Get, Inject, Param } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { USER_SERVICE } from '@app/contracts/constants/services/user-service.constant';
import { rpcCall } from '../utils/rpc-call';

@Controller('users')
export class UserController {
  constructor(
    @Inject(USER_SERVICE.NAME) private readonly userClient: ClientProxy,
  ) {}

  @Get()
  findAll() {
    return rpcCall(this.userClient, USER_SERVICE.ACTIONS.FIND_ALL, {});
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return rpcCall(this.userClient, USER_SERVICE.ACTIONS.FIND_ONE, { id });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return rpcCall(this.userClient, USER_SERVICE.ACTIONS.DELETE, { id });
  }
}
