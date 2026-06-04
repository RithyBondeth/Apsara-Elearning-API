import { Controller, Get } from '@nestjs/common';

@Controller('api-gateway')
export class ApiGatewayController {
  constructor() {}

  @Get('ping')
  ping(): string {
    return 'Ping from api-gateway!';
  }
}
