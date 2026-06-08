import { Module } from '@nestjs/common';
import { UserServiceController } from './user-service.controller';
import { ConfigModule, LoggerModule } from '@app/common';
import { DatabaseModule } from '@app/database';

@Module({
  imports: [ConfigModule, LoggerModule, DatabaseModule],
  controllers: [UserServiceController],
})
export class UserServiceModule {}
