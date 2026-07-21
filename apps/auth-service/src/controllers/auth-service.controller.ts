import {
  ChangePasswordPayloadDTO,
  ForgotPasswordRequestDTO,
  LoginRequestDTO,
  LoginResponseDTO,
  MessageResponseDTO,
  RegisterRequestDTO,
  RegisterResponseDTO,
  ResetPasswordRequestDTO,
} from '@app/contracts';
import { AUTH_SERVICE } from '@app/contracts/constants/services/auth-service.constant';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RegisterService } from '../services/register.service';
import { LoginService } from '../services/login.service';
import { TokenService } from '../services/token.service';
import { EmailVerificationService } from '../services/email-verification.service';
import { PasswordService } from '../services/password.service';

@Controller()
export class AuthServiceController {
  constructor(
    private readonly registerService: RegisterService,
    private readonly loginService: LoginService,
    private readonly tokenService: TokenService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly passwordService: PasswordService,
  ) {}

  @MessagePattern(AUTH_SERVICE.ACTIONS.REGISTER)
  register(
    @Payload() registerDTO: RegisterRequestDTO,
  ): Promise<RegisterResponseDTO> {
    return this.registerService.register(registerDTO);
  }

  @MessagePattern(AUTH_SERVICE.ACTIONS.LOGIN)
  login(@Payload() loginDTO: LoginRequestDTO): Promise<LoginResponseDTO> {
    return this.loginService.login(loginDTO);
  }

  @MessagePattern(AUTH_SERVICE.ACTIONS.REFRESH_TOKEN)
  refresh(
    @Payload() payload: { refreshToken: string },
  ): Promise<RegisterResponseDTO> {
    return this.tokenService.refresh(payload.refreshToken);
  }

  @MessagePattern(AUTH_SERVICE.ACTIONS.LOGOUT)
  logout(@Payload() payload: { userId: string }): Promise<MessageResponseDTO> {
    return this.tokenService.logout(payload.userId);
  }

  @MessagePattern(AUTH_SERVICE.ACTIONS.VERIFY_EMAIL)
  verifyEmail(
    @Payload() payload: { token: string },
  ): Promise<MessageResponseDTO> {
    return this.emailVerificationService.verifyEmail(payload.token);
  }

  @MessagePattern(AUTH_SERVICE.ACTIONS.SEND_VERIFICATION_EMAIL)
  resendVerification(
    @Payload() payload: { email: string },
  ): Promise<MessageResponseDTO> {
    return this.emailVerificationService.resendVerification(payload.email);
  }

  @MessagePattern(AUTH_SERVICE.ACTIONS.FORGOT_PASSWORD)
  forgotPassword(
    @Payload() dto: ForgotPasswordRequestDTO,
  ): Promise<MessageResponseDTO> {
    return this.passwordService.forgotPassword(dto);
  }

  @MessagePattern(AUTH_SERVICE.ACTIONS.RESET_PASSWORD)
  resetPassword(
    @Payload() dto: ResetPasswordRequestDTO,
  ): Promise<MessageResponseDTO> {
    return this.passwordService.resetPassword(dto);
  }

  @MessagePattern(AUTH_SERVICE.ACTIONS.CHANGE_PASSWORD)
  changePassword(
    @Payload() dto: ChangePasswordPayloadDTO,
  ): Promise<MessageResponseDTO> {
    return this.passwordService.changePassword(dto);
  }
}
