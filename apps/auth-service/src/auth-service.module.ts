import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthServiceController } from './auth-service.controller';
import { ConfigModule, LoggerModule } from '@app/common';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL!],
          queue: process.env.AUTH_QUEUE!,
        },
      },
    ]),
  ],
  controllers: [AuthServiceController],
})
export class AuthServiceModule {}
