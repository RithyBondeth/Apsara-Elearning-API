import { Controller, Get } from '@nestjs/common';

@Controller('user-service')
export class UserServiceController {
  constructor() {}

  @Get('ping')
  ping(): string {
    return 'Ping from user-service!';
  }
}
