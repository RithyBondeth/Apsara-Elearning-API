import { AUTH_SERVICE } from '@app/contracts/constants/services/auth-service.constant';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AuthServiceController {
  constructor() {}

  @MessagePattern(AUTH_SERVICE.ACTIONS.PING)
  ping(): string {
    return 'Ping from auth-service!';
  }
}
