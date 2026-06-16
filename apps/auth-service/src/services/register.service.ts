import { RegisterRequestDTO, RegisterResponseDTO } from '@app/contracts';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { user } from '@app/database/schemas/user/user.schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { DRIZZLE } from '@app/contracts';
import {
  EmailService,
  IJWTPayload,
  JwtService,
  RpcConflictException,
  RpcInternalException,
} from '@app/common';
import ms from 'ms';

@Injectable()
export class RegisterService {
  private readonly logger = new Logger(RegisterService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: NeonHttpDatabase<any>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async register(
    registerRequestDTO: RegisterRequestDTO,
  ): Promise<RegisterResponseDTO> {
    const { email, password, firstName, lastName, gender, phone, dateOfBirth } =
      registerRequestDTO;

    // 1. Check existing credentials (fast path)
    const existingUsers = await this.db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUsers.length > 0) {
      throw new RpcConflictException('User with this email already exists');
    }

    // 2. Prepare security data
    const saltRounds = this.configService.get<number>('bcrypt.salt') ?? 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const emailVerificationToken =
      await this.jwtService.generateEmailVerificationToken(email);

    // Calculate expiration based on config
    const emailExpiresStr =
      this.configService.get<string>('jwt.emailExpires') ?? '1h';
    const emailVerificationTokenExpiresAt = new Date(
      Date.now() + ms(emailExpiresStr as any),
    );

    const refreshExpiresStr =
      this.configService.get<string>('jwt.refreshExpires') ?? '7d';
    const refreshTokenExpiresAt = new Date(
      Date.now() + ms(refreshExpiresStr as any),
    );

    try {
      return await this.db.transaction(async (tx) => {
        // 3. Create user
        const [newUser] = await tx
          .insert(user)
          .values({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            gender,
            phone,
            dateOfBirth:
              dateOfBirth instanceof Date
                ? dateOfBirth.toISOString().split('T')[0]
                : dateOfBirth,
            emailVerificationToken,
            emailVerificationTokenExpiresAt,
          })
          .returning();

        // 4. Generate tokens
        const jwtPayload: IJWTPayload = {
          id: newUser.id,
          info: newUser.email,
          isAdmin: newUser.isAdmin,
        };

        const [accessToken, refreshToken] = await Promise.all([
          this.jwtService.generateToken(jwtPayload),
          this.jwtService.generateRefreshToken(newUser.id),
        ]);

        // 5. Update user with refresh token
        await tx
          .update(user)
          .set({
            refreshToken,
            refreshTokenExpiresAt,
          })
          .where(eq(user.id, newUser.id));

        // 6. Send email verification (Inside transaction to ensure token delivery if committed)
        // Warning: If email service is slow, it blocks the DB transaction.
        await this.emailService.sendVerificationEmail(
          email,
          emailVerificationToken,
        );

        this.logger.log(`User registered: ${email}`);

        return new RegisterResponseDTO({
          message: 'User registered successfully',
          accessToken,
          refreshToken,
        });
      });
    } catch (error) {
      this.logger.error(`Registration failed for ${email}:`, error);

      // Handle duplicate key error from Postgres (race condition)
      if (
        error.message?.includes('unique constraint') ||
        error.code === '23505'
      ) {
        throw new RpcConflictException('User with this email already exists');
      }

      if (error instanceof RpcException) throw error;
      throw new RpcInternalException('An error occurred during registration');
    }
  }
}
