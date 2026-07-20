import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { user } from '@app/database/schemas/user/user.schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import {
  ChangePasswordPayloadDTO,
  DRIZZLE,
  ForgotPasswordRequestDTO,
  MessageResponseDTO,
  ResetPasswordRequestDTO,
} from '@app/contracts';
import {
  EmailService,
  JwtService,
  RpcBadRequestException,
  RpcNotFoundException,
  RpcUnauthorizedException,
} from '@app/common';
import ms from 'ms';

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async forgotPassword(
    dto: ForgotPasswordRequestDTO,
  ): Promise<MessageResponseDTO> {
    // Generic response to avoid account enumeration.
    const genericResponse = new MessageResponseDTO({
      message: 'If the account exists, a password reset email has been sent',
    });

    const [foundUser] = await this.db
      .select()
      .from(user)
      .where(eq(user.email, dto.email))
      .limit(1);

    if (!foundUser) {
      return genericResponse;
    }

    const resetPasswordToken = await this.jwtService.generatePasswordResetToken(
      dto.email,
    );

    const emailExpiresStr =
      this.configService.get<string>('jwt.emailExpires') ?? '1h';
    const resetPasswordTokenExpiresAt = new Date(
      Date.now() + ms(emailExpiresStr as any),
    );

    await this.db
      .update(user)
      .set({ resetPasswordToken, resetPasswordTokenExpiresAt })
      .where(eq(user.id, foundUser.id));

    await this.emailService.sendPasswordResetEmail(
      dto.email,
      resetPasswordToken,
    );

    this.logger.log(`Password reset requested: ${dto.email}`);

    return genericResponse;
  }

  async resetPassword(
    dto: ResetPasswordRequestDTO,
  ): Promise<MessageResponseDTO> {
    // 1. Validate token signature/type
    let decoded: { email: string; type: string };
    try {
      decoded = await this.jwtService.verifyPasswordResetToken(dto.token);
    } catch {
      throw new RpcBadRequestException('Invalid or expired reset token');
    }

    // 2. Match against the stored token
    const [foundUser] = await this.db
      .select()
      .from(user)
      .where(eq(user.email, decoded.email))
      .limit(1);

    if (
      !foundUser ||
      foundUser.resetPasswordToken !== dto.token ||
      !foundUser.resetPasswordTokenExpiresAt ||
      foundUser.resetPasswordTokenExpiresAt.getTime() < Date.now()
    ) {
      throw new RpcBadRequestException('Invalid or expired reset token');
    }

    // 3. Hash and store the new password; clear reset token and any sessions
    const saltRounds = this.configService.get<number>('bcrypt.salt') ?? 10;
    const hashedPassword = await bcrypt.hash(dto.newPassword, saltRounds);

    await this.db
      .update(user)
      .set({
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordTokenExpiresAt: null,
        refreshToken: null,
        refreshTokenExpiresAt: null,
      })
      .where(eq(user.id, foundUser.id));

    this.logger.log(`Password reset: ${foundUser.email}`);

    return new MessageResponseDTO({ message: 'Password reset successfully' });
  }

  async changePassword(
    dto: ChangePasswordPayloadDTO,
  ): Promise<MessageResponseDTO> {
    const [foundUser] = await this.db
      .select()
      .from(user)
      .where(eq(user.id, dto.userId))
      .limit(1);

    if (!foundUser) {
      throw new RpcNotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      foundUser.password,
    );
    if (!isPasswordValid) {
      throw new RpcUnauthorizedException('Current password is incorrect');
    }

    const saltRounds = this.configService.get<number>('bcrypt.salt') ?? 10;
    const hashedPassword = await bcrypt.hash(dto.newPassword, saltRounds);

    await this.db
      .update(user)
      .set({ password: hashedPassword })
      .where(eq(user.id, foundUser.id));

    this.logger.log(`Password changed: ${foundUser.email}`);

    return new MessageResponseDTO({ message: 'Password changed successfully' });
  }
}
