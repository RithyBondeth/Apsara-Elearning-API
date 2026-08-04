import { Module } from '@nestjs/common';
import {
  ConfigurationModule,
  EmailModule,
  HealthModule,
  JwtModule,
  LoggerModule,
  RedisModule,
} from '@app/common';
import { DatabaseModule } from '@app/database';
import {
  I_EMAIL_VERIFICATION_SERVICE,
  I_LOGIN_SERVICE,
  I_PASSWORD_SERVICE,
  I_REGISTER_SERVICE,
  I_TOKEN_SERVICE,
} from '@app/contracts';
import { RegisterController } from './basic/controllers/register.controller';
import { LoginController } from './basic/controllers/login.controller';
import { RefreshTokenController } from './basic/controllers/refresh-token.controller';
import { LogoutController } from './basic/controllers/logout.controller';
import { VerifyEmailController } from './basic/controllers/verify-email.controller';
import { ResendVerificationController } from './basic/controllers/resend-verification.controller';
import { ForgotPasswordController } from './basic/controllers/forgot-password.controller';
import { ResetPasswordController } from './basic/controllers/reset-password.controller';
import { ChangePasswordController } from './basic/controllers/change-password.controller';
import { RegisterService } from './basic/services/register.service';
import { LoginService } from './basic/services/login.service';
import { LoginAttemptsService } from './basic/services/login-attempts.service';
import { TokenService } from './basic/services/token.service';
import { EmailVerificationService } from './basic/services/email-verification.service';
import { PasswordService } from './basic/services/password.service';
import { AuthHealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigurationModule,
    LoggerModule,
    DatabaseModule,
    JwtModule,
    EmailModule,
    HealthModule,
    RedisModule,
  ],
  controllers: [
    RegisterController,
    LoginController,
    RefreshTokenController,
    LogoutController,
    VerifyEmailController,
    ResendVerificationController,
    ForgotPasswordController,
    ResetPasswordController,
    ChangePasswordController,
    AuthHealthController,
  ],
  providers: [
    LoginAttemptsService,
    { provide: I_REGISTER_SERVICE, useClass: RegisterService },
    { provide: I_LOGIN_SERVICE, useClass: LoginService },
    { provide: I_TOKEN_SERVICE, useClass: TokenService },
    {
      provide: I_EMAIL_VERIFICATION_SERVICE,
      useClass: EmailVerificationService,
    },
    { provide: I_PASSWORD_SERVICE, useClass: PasswordService },
  ],
})
export class AuthServiceModule {}
