import { AUTH_SERVICE } from '@app/contracts/constants/services/auth-service.constant';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { rpcCall } from '../utils/rpc-call';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  RegisterRequestDTO,
  RegisterResponseDTO,
  LoginRequestDTO,
  LoginResponseDTO,
  RefreshTokenRequestDTO,
  VerifyEmailRequestDTO,
  ResendVerificationRequestDTO,
  ForgotPasswordRequestDTO,
  ResetPasswordRequestDTO,
  ChangePasswordRequestDTO,
  MessageResponseDTO,
} from '@app/contracts';
import { CurrentUser, JwtAuthGuard } from '@app/common';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE.NAME) private readonly authClient: ClientProxy,
  ) {}

  @Post('register')
  register(
    @Body() registerRequestDTO: RegisterRequestDTO,
  ): Promise<RegisterResponseDTO> {
    return rpcCall<RegisterResponseDTO>(
      this.authClient,
      AUTH_SERVICE.ACTIONS.REGISTER,
      registerRequestDTO,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginRequestDTO: LoginRequestDTO): Promise<LoginResponseDTO> {
    return rpcCall<LoginResponseDTO>(
      this.authClient,
      AUTH_SERVICE.ACTIONS.LOGIN,
      loginRequestDTO,
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(
    @Body() refreshTokenRequestDTO: RefreshTokenRequestDTO,
  ): Promise<RegisterResponseDTO> {
    return rpcCall<RegisterResponseDTO>(
      this.authClient,
      AUTH_SERVICE.ACTIONS.REFRESH_TOKEN,
      refreshTokenRequestDTO,
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  logout(@CurrentUser('id') userId: string): Promise<MessageResponseDTO> {
    return rpcCall<MessageResponseDTO>(
      this.authClient,
      AUTH_SERVICE.ACTIONS.LOGOUT,
      { userId },
    );
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(
    @Body() verifyEmailRequestDTO: VerifyEmailRequestDTO,
  ): Promise<MessageResponseDTO> {
    return rpcCall<MessageResponseDTO>(
      this.authClient,
      AUTH_SERVICE.ACTIONS.VERIFY_EMAIL,
      verifyEmailRequestDTO,
    );
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  resendVerification(
    @Body() resendVerificationRequestDTO: ResendVerificationRequestDTO,
  ): Promise<MessageResponseDTO> {
    return rpcCall<MessageResponseDTO>(
      this.authClient,
      AUTH_SERVICE.ACTIONS.SEND_VERIFICATION_EMAIL,
      resendVerificationRequestDTO,
    );
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(
    @Body() forgotPasswordRequestDTO: ForgotPasswordRequestDTO,
  ): Promise<MessageResponseDTO> {
    return rpcCall<MessageResponseDTO>(
      this.authClient,
      AUTH_SERVICE.ACTIONS.FORGOT_PASSWORD,
      forgotPasswordRequestDTO,
    );
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(
    @Body() resetPasswordRequestDTO: ResetPasswordRequestDTO,
  ): Promise<MessageResponseDTO> {
    return rpcCall<MessageResponseDTO>(
      this.authClient,
      AUTH_SERVICE.ACTIONS.RESET_PASSWORD,
      resetPasswordRequestDTO,
    );
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordRequestDTO: ChangePasswordRequestDTO,
  ): Promise<MessageResponseDTO> {
    return rpcCall<MessageResponseDTO>(
      this.authClient,
      AUTH_SERVICE.ACTIONS.CHANGE_PASSWORD,
      { userId, ...changePasswordRequestDTO },
    );
  }
}
