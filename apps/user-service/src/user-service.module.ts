import { Module } from '@nestjs/common';
import { ConfigurationModule, HealthModule, LoggerModule } from '@app/common';
import { DatabaseModule } from '@app/database';
import { I_BADGE_SERVICE, I_USER_SERVICE } from '@app/contracts';
import { UserController } from './controllers/user.controller';
import { BadgeController } from './controllers/badge.controller';
import { UserRpcService } from './services/user.service';
import { BadgeRpcService } from './services/badge.service';
import { UserHealthController } from './health/health.controller';

@Module({
  imports: [ConfigurationModule, LoggerModule, DatabaseModule, HealthModule],
  controllers: [UserController, BadgeController, UserHealthController],
  providers: [
    { provide: I_USER_SERVICE, useClass: UserRpcService },
    { provide: I_BADGE_SERVICE, useClass: BadgeRpcService },
  ],
})
export class UserServiceModule {}
