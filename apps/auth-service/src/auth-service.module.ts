import { Module } from '@nestjs/common';
import { AuthServiceController } from './controllers/auth-service.controller';
import {
  ConfigurationModule,
  EmailModule,
  JwtModule,
  LoggerModule,
} from '@app/common';
import { DatabaseModule } from '@app/database';
import { RegisterService } from './services/register.service';
import { LoginService } from './services/login.service';
import { TokenService } from './services/token.service';
import { EmailVerificationService } from './services/email-verification.service';
import { PasswordService } from './services/password.service';

@Module({
  imports: [
    ConfigurationModule,
    LoggerModule,
    DatabaseModule,
    JwtModule,
    EmailModule,
  ],
  controllers: [AuthServiceController],
  providers: [
    RegisterService,
    LoginService,
    TokenService,
    EmailVerificationService,
    PasswordService,
  ],
})
export class AuthServiceModule {}
