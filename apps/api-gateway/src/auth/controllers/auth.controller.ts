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
import { rpcCall } from '../../utils/rpc-call';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
import { Throttle } from '@nestjs/throttler';

// Tighter limits on credential-sensitive endpoints (per IP, per minute).
const STRICT = { default: { limit: 5, ttl: 60_000 } };
const LOGIN = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE.NAME) private readonly authClient: ClientProxy,
  ) {}

  @Post('register')
  @Throttle(LOGIN)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
    type: RegisterResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User already exists',
  })
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
  @Throttle(LOGIN)
  @ApiOperation({ summary: 'Login user and return tokens' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: LoginResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  login(@Body() loginRequestDTO: LoginRequestDTO): Promise<LoginResponseDTO> {
    return rpcCall<LoginResponseDTO>(
      this.authClient,
      AUTH_SERVICE.ACTIONS.LOGIN,
      loginRequestDTO,
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens refreshed successfully',
    type: RegisterResponseDTO,
  })
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
  @ApiOperation({ summary: 'Logout user and invalidate refresh token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logged out successfully',
    type: MessageResponseDTO,
  })
  logout(@CurrentUser('id') userId: string): Promise<MessageResponseDTO> {
    return rpcCall<MessageResponseDTO>(
      this.authClient,
      AUTH_SERVICE.ACTIONS.LOGOUT,
      { userId },
    );
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user email with token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully',
    type: MessageResponseDTO,
  })
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
  @Throttle(STRICT)
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification email sent',
    type: MessageResponseDTO,
  })
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
  @Throttle(STRICT)
  @ApiOperation({ summary: 'Send password reset link' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset link sent',
    type: MessageResponseDTO,
  })
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
  @Throttle(STRICT)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
    type: MessageResponseDTO,
  })
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
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully',
    type: MessageResponseDTO,
  })
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
