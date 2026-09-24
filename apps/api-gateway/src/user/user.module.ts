import { USER_SERVICE } from '@app/contracts/constants/services/user-service.constant';
import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { BadgeController } from './controllers/badge.controller';
import { LeaderboardController } from './controllers/leaderboard.controller';
import { NotificationController } from './controllers/notification.controller';
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
  controllers: [
    UserController,
    BadgeController,
    LeaderboardController,
    NotificationController,
  ],
})
export class UserModule {}
