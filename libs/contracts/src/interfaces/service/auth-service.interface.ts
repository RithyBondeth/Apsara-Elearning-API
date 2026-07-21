import { ChangePasswordPayloadDTO } from '../../dtos/auth/change-password.dto';
import { ForgotPasswordRequestDTO } from '../../dtos/auth/forgot-password.dto';
import { LoginRequestDTO, LoginResponseDTO } from '../../dtos/auth/login.dto';
import { MessageResponseDTO } from '../../dtos/auth/message-response.dto';
import {
  RegisterRequestDTO,
  RegisterResponseDTO,
} from '../../dtos/auth/register.dto';
import { ResetPasswordRequestDTO } from '../../dtos/auth/reset-password.dto';

/**
 * DI tokens for the auth-service business services. Controllers depend on these
 * interfaces rather than the concrete classes, so the wiring (module providers)
 * is the single place that binds an implementation to a contract.
 */
export const I_REGISTER_SERVICE = 'IRegisterService';
export const I_LOGIN_SERVICE = 'ILoginService';
export const I_TOKEN_SERVICE = 'ITokenService';
export const I_EMAIL_VERIFICATION_SERVICE = 'IEmailVerificationService';
export const I_PASSWORD_SERVICE = 'IPasswordService';

export interface IRegisterService {
  register(registerDTO: RegisterRequestDTO): Promise<RegisterResponseDTO>;
}

export interface ILoginService {
  login(loginDTO: LoginRequestDTO): Promise<LoginResponseDTO>;
}

export interface ITokenService {
  refresh(refreshToken: string): Promise<RegisterResponseDTO>;
  logout(userId: string): Promise<MessageResponseDTO>;
}

export interface IEmailVerificationService {
  verifyEmail(token: string): Promise<MessageResponseDTO>;
  resendVerification(email: string): Promise<MessageResponseDTO>;
}

export interface IPasswordService {
  forgotPassword(dto: ForgotPasswordRequestDTO): Promise<MessageResponseDTO>;
  resetPassword(dto: ResetPasswordRequestDTO): Promise<MessageResponseDTO>;
  changePassword(dto: ChangePasswordPayloadDTO): Promise<MessageResponseDTO>;
}
