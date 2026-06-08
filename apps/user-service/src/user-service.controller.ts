import { USER_SERVICE } from '@app/contracts/constants/services/user-service.constant';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class UserServiceController {
  constructor() {}

  @MessagePattern(USER_SERVICE.ACTIONS.PING)
  ping(): string {
    return 'Ping from user-service!';
  }
}
