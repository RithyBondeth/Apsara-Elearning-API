import {
  IRegisterService,
  RegisterRequestDTO,
  RegisterResponseDTO,
} from '@app/contracts';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
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
export class RegisterService implements IRegisterService {
  private readonly logger = new Logger(RegisterService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
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

    let accessToken: string;
    let refreshToken: string;
    try {
      // 3. Create the user + issue tokens.
      // interactive transactions, so these run as sequential auto-committed
      // statements (the unique email constraint still guards duplicates).
      const [newUser] = await this.db
        .insert(user)
        .values({
          email,
          password: hashedPassword,
          firstName,
          lastName,
          gender,
          phone,
          dateOfBirth, // 'YYYY-MM-DD' string (validated by @IsDateString)
          emailVerificationToken,
          emailVerificationTokenExpiresAt,
        })
        .returning();

      const jwtPayload: IJWTPayload = {
        id: newUser.id,
        info: newUser.email,
        isAdmin: newUser.isAdmin,
      };

      const [access, refresh] = await Promise.all([
        this.jwtService.generateToken(jwtPayload),
        this.jwtService.generateRefreshToken(newUser.id),
      ]);

      await this.db
        .update(user)
        .set({ refreshToken: refresh, refreshTokenExpiresAt })
        .where(eq(user.id, newUser.id));

      accessToken = access;
      refreshToken = refresh;
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

    // 4. Send the verification email AFTER the transaction commits — best
    // effort, so a slow/failing email provider can't roll back the new user.
    try {
      await this.emailService.sendVerificationEmail(
        email,
        emailVerificationToken,
      );
    } catch (error) {
      this.logger.error(
        `User ${email} created, but the verification email failed to send`,
        error instanceof Error ? error.stack : error,
      );
    }

    this.logger.log(`User registered: ${email}`);
    return new RegisterResponseDTO({
      message: 'User registered successfully',
      accessToken,
      refreshToken,
    });
  }
}
