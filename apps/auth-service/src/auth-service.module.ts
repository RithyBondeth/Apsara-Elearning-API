import { Module } from '@nestjs/common';
import { AuthServiceController } from './auth-service.controller';
import { ConfigModule, LoggerModule } from '@app/common';
import { DatabaseModule } from '@app/database';

@Module({
  imports: [ConfigModule, LoggerModule, DatabaseModule],
  controllers: [AuthServiceController],
})
export class AuthServiceModule {}
