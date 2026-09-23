import { Module } from '@nestjs/common';
import { ConfigurationModule, HealthModule, LoggerModule } from '@app/common';
import { DatabaseModule } from '@app/database';
import {
  I_BADGE_SERVICE,
  I_NOTIFICATION_SERVICE,
  I_USER_SERVICE,
} from '@app/contracts';
import { UserController } from './controllers/user.controller';
import { BadgeController } from './controllers/badge.controller';
import { NotificationController } from './controllers/notification.controller';
import { UserService } from './services/user.service';
import { BadgeService } from './services/badge.service';
import { NotificationService } from './services/notification.service';
import { UserHealthController } from './health/health.controller';

@Module({
  imports: [ConfigurationModule, LoggerModule, DatabaseModule, HealthModule],
  controllers: [
    UserController,
    BadgeController,
    NotificationController,
    UserHealthController,
  ],
  providers: [
    { provide: I_USER_SERVICE, useClass: UserService },
    { provide: I_BADGE_SERVICE, useClass: BadgeService },
    { provide: I_NOTIFICATION_SERVICE, useClass: NotificationService },
    NotificationService,
  ],
})
export class UserServiceModule {}
