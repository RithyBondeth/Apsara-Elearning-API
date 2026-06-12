import { Module } from '@nestjs/common';
import { AuthServiceController } from './controllers/auth-service.controller';
import { ConfigurationModule, JwtModule, LoggerModule } from '@app/common';
import { DatabaseModule } from '@app/database';
import { RegisterService } from './services/register.service';
import { LoginService } from './services/login.service';

@Module({
  imports: [ConfigurationModule, LoggerModule, DatabaseModule, JwtModule],
  controllers: [AuthServiceController],
  providers: [RegisterService, LoginService],
})
export class AuthServiceModule {}
