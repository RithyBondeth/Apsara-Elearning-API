import { USER_SERVICE } from '@app/contracts/constants/services/user-service.constant';
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { RabbitmqModule } from '@app/common';

@Module({
  imports: [
    RabbitmqModule.register([
      {
        name: USER_SERVICE.NAME,
        queueKey: 'rabbitmq.userQueue',
      },
    ]),
  ],
  controllers: [UserController],
})
export class UserModule {}
