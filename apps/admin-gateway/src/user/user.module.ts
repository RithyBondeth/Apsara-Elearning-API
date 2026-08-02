import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { USER_SERVICE } from '@app/contracts/constants/services/user-service.constant';
import { UserController } from './controllers/user.controller';
import { BadgeController } from './controllers/badge.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: USER_SERVICE.NAME,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('rabbitmq.url')!],
            queue: configService.get<string>('rabbitmq.userQueue')!,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [UserController, BadgeController],
})
export class UserModule {}
