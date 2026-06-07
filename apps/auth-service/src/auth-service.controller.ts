import { AUTH_SERVICE } from '@app/contracts/constants/services/auth-service.constant';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';

@Controller()
export class AuthServiceController {
  constructor(private readonly logger: Logger) {}

  @MessagePattern(AUTH_SERVICE.ACTIONS.PING)
  ping(): string {
    this.logger.log('Ping action called in auth-service');
    return 'Ping from auth-service!';
  }
}
