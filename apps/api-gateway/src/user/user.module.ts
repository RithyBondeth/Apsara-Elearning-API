import { USER_SERVICE } from '@app/contracts/constants/services/user-service.constant';
import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { BadgeController } from './controllers/badge.controller';
import { JwtModule, RabbitmqModule } from '@app/common';

@Module({
  imports: [
    JwtModule,
    RabbitmqModule.register([
      {
        name: USER_SERVICE.NAME,
        queueKey: 'rabbitmq.userQueue',
      },
    ]),
  ],
  controllers: [UserController, BadgeController],
})
export class UserModule {}
