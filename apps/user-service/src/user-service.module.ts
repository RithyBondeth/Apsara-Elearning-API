import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
@Module({
  imports: [
    ClientsModule.register([
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
})
export class UserServiceModule {}
