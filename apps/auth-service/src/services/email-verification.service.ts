import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { user } from '@app/database/schemas/user/user.schema';
import { eq } from 'drizzle-orm';
import { ConfigService } from '@nestjs/config';
import { DRIZZLE, MessageResponseDTO } from '@app/contracts';
import { EmailService, JwtService, RpcBadRequestException } from '@app/common';
import ms from 'ms';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async verifyEmail(token: string): Promise<MessageResponseDTO> {
    // 1. Validate token signature/type
    let decoded: { email: string; type: string };
    try {
      decoded = await this.jwtService.verifyEmailToken(token);
    } catch {
      throw new RpcBadRequestException('Invalid or expired verification token');
    }

    // 2. Match against the stored token
    const [foundUser] = await this.db
      .select()
      .from(user)
      .where(eq(user.email, decoded.email))
      .limit(1);

    if (!foundUser) {
      throw new RpcBadRequestException('Invalid or expired verification token');
    }

    if (foundUser.isEmailVerified) {
      return new MessageResponseDTO({ message: 'Email already verified' });
    }

    if (
      foundUser.emailVerificationToken !== token ||
      !foundUser.emailVerificationTokenExpiresAt ||
      foundUser.emailVerificationTokenExpiresAt.getTime() < Date.now()
    ) {
      throw new RpcBadRequestException('Invalid or expired verification token');
    }

    // 3. Mark verified and clear the token
    await this.db
      .update(user)
      .set({
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
      })
      .where(eq(user.id, foundUser.id));

    this.logger.log(`Email verified: ${foundUser.email}`);

    return new MessageResponseDTO({ message: 'Email verified successfully' });
  }

  async resendVerification(email: string): Promise<MessageResponseDTO> {
    // Generic response to avoid leaking which emails are registered.
    const genericResponse = new MessageResponseDTO({
      message: 'If the account exists, a verification email has been sent',
    });

    const [foundUser] = await this.db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!foundUser || foundUser.isEmailVerified) {
      return genericResponse;
    }

    const emailVerificationToken =
      await this.jwtService.generateEmailVerificationToken(email);

    const emailExpiresStr =
      this.configService.get<string>('jwt.emailExpires') ?? '1h';
    const emailVerificationTokenExpiresAt = new Date(
      Date.now() + ms(emailExpiresStr as any),
    );

    await this.db
      .update(user)
      .set({ emailVerificationToken, emailVerificationTokenExpiresAt })
      .where(eq(user.id, foundUser.id));

    await this.emailService.sendVerificationEmail(
      email,
      emailVerificationToken,
    );

    this.logger.log(`Verification email resent: ${email}`);

    return genericResponse;
  }
}
