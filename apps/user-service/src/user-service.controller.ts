import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class UserServiceController {
  constructor() {}

  @MessagePattern('user.ping')
  ping(): string {
    return 'Ping from user-service!';
  }
}
