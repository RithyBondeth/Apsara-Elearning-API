import { Module } from '@nestjs/common';
import { ConfigurationModule, LoggerModule } from '@app/common';
import { DatabaseModule } from '@app/database';
import { UserRpcController } from './controllers/user-rpc.controller';
import { BadgeRpcController } from './controllers/badge-rpc.controller';
import { UserRpcService } from './services/user-rpc.service';
import { BadgeRpcService } from './services/badge-rpc.service';

@Module({
  imports: [ConfigurationModule, LoggerModule, DatabaseModule],
  controllers: [UserRpcController, BadgeRpcController],
  providers: [UserRpcService, BadgeRpcService],
})
export class UserServiceModule {}
