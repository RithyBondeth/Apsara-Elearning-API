import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserServiceController } from './user-service.controller';
import { ConfigModule, LoggerModule } from '@app/common';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
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
  controllers: [UserServiceController],
})
export class UserServiceModule {}
