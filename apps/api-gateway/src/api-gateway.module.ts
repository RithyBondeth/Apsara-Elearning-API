import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth/auth.controller';
import { UserController } from './user/user.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL!],
          queue: process.env.AUTH_QUEUE!,
        },
      },
      {
        name: 'USER_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL!],
          queue: process.env.USER_QUEUE!,
        },
      },
    ]),
  ],
  controllers: [AuthController, UserController],
  exports: [ClientsModule],
})
export class ApiGatewayModule {}
