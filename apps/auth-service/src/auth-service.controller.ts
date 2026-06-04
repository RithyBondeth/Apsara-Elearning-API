import { Controller, Get } from '@nestjs/common';

@Controller('auth-service')
export class AuthServiceController {
  constructor() {}

  @Get('ping')
  ping(): string {
    return 'Ping from auth-service!';
  }
}
