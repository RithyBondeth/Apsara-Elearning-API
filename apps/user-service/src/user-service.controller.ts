import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller('user-service')
export class UserServiceController {
  constructor() {}

  @MessagePattern('user.ping')
  ping(): string {
    return 'Ping from user-service!';
  }
}
