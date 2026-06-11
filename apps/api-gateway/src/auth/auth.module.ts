import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AUTH_SERVICE } from '@app/contracts/constants/services/auth-service.constant';
import { RabbitmqModule } from '@app/common';

@Module({
  imports: [
    RabbitmqModule.register([
      {
        name: AUTH_SERVICE.NAME,
        queueKey: 'rabbitmq.authQueue',
      },
    ]),
  ],
  controllers: [AuthController],
})
export class AuthModule {}
