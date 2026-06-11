import { Module } from '@nestjs/common';
import { AuthServiceController } from './auth-service.controller';
import { ConfigModule, LoggerModule } from '@app/common';
import { DatabaseModule } from '@app/database';
import { AuthServiceService } from './auth-service.service';

@Module({
  imports: [ConfigModule, LoggerModule, DatabaseModule],
  controllers: [AuthServiceController],
  providers: [AuthServiceService],
})
export class AuthServiceModule {}
