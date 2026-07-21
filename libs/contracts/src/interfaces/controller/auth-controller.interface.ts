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
 * RPC controller contracts — one per action, mirroring the basic/controllers
 * split in auth-service. Each gateway-facing microservice controller implements
 * exactly one of these.
 */
export interface IRegisterRpcController {
  register(registerDTO: RegisterRequestDTO): Promise<RegisterResponseDTO>;
}

export interface ILoginRpcController {
  login(loginDTO: LoginRequestDTO): Promise<LoginResponseDTO>;
}

export interface IRefreshTokenRpcController {
  refresh(payload: { refreshToken: string }): Promise<RegisterResponseDTO>;
}

export interface ILogoutRpcController {
  logout(payload: { userId: string }): Promise<MessageResponseDTO>;
}

export interface IVerifyEmailRpcController {
  verifyEmail(payload: { token: string }): Promise<MessageResponseDTO>;
}

export interface IResendVerificationRpcController {
  resendVerification(payload: { email: string }): Promise<MessageResponseDTO>;
}

export interface IForgotPasswordRpcController {
  forgotPassword(dto: ForgotPasswordRequestDTO): Promise<MessageResponseDTO>;
}

export interface IResetPasswordRpcController {
  resetPassword(dto: ResetPasswordRequestDTO): Promise<MessageResponseDTO>;
}

export interface IChangePasswordRpcController {
  changePassword(dto: ChangePasswordPayloadDTO): Promise<MessageResponseDTO>;
}
