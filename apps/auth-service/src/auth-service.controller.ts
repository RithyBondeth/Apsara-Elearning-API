import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AuthServiceController {
  constructor() {}
  
  @MessagePattern('auth.ping')
  ping(): string {
    return 'Ping from auth-service!';
  }
}
