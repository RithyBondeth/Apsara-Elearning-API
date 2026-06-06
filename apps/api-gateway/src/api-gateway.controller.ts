import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller('api-gateway')
export class ApiGatewayController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
  ) {}

  @Get('auth/ping')
  async pingAuth(): Promise<any> {
    return this.authClient.send('auth.ping', {});
  }

  @Get('user/ping')
  async pingUser(): Promise<any> {
    return this.userClient.send('user.ping', {});
  }
}
