import {
  ILoginService,
  LoginRequestDTO,
  LoginResponseDTO,
} from '@app/contracts';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { user } from '@app/database/schemas/user/user.schema';
import { eq, sql } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { DRIZZLE } from '@app/contracts';
import {
  hashRefreshToken,
  IJWTPayload,
  JwtService,
  RpcForbiddenException,
  RpcUnauthorizedException,
} from '@app/common';
import { ConfigService } from '@nestjs/config';
import ms, { StringValue } from 'ms';

@Injectable()
export class LoginService implements ILoginService {
  private readonly logger = new Logger(LoginService.name);
  private readonly dummyPasswordHash =
    '$2b$12$8COZzWzwmv3IuQphiMbFZuaxNByAwC6hpsrwpjJGXIV/xFT9SLhg2';

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginRequestDTO: LoginRequestDTO): Promise<LoginResponseDTO> {
    const { email, password } = loginRequestDTO;

    // 1. Find user by email
    const [foundUser] = await this.db
      .select()
      .from(user)
      .where(eq(sql<string>`lower(${user.email})`, email))
      .limit(1);

    if (!foundUser) {
      // Keep unknown-account and wrong-password paths computationally similar.
      await bcrypt.compare(password, this.dummyPasswordHash);
      throw new RpcUnauthorizedException('Invalid credentials');
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(password, foundUser.password);
    if (!isPasswordValid) {
      throw new RpcUnauthorizedException('Invalid credentials');
    }

    // 3. Check if email is verified
    if (!foundUser.isEmailVerified) {
      throw new RpcForbiddenException('Email not verified');
    }

    // 4. Generate tokens
    const jwtPayload: IJWTPayload = {
      id: foundUser.id,
      info: foundUser.email,
      type: 'access',
      role: foundUser.isAdmin ? 'admin' : 'student',
      isAdmin: foundUser.isAdmin,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.generateToken(jwtPayload),
      this.jwtService.generateRefreshToken(foundUser.id),
    ]);

    // 5. Update refresh token and login info in DB
    const refreshExpiresStr =
      this.configService.get<string>('jwt.refreshExpires') ?? '7d';
    const refreshTokenExpiresAt = new Date(
      Date.now() + ms(refreshExpiresStr as StringValue),
    );

    await this.db
      .update(user)
      .set({
        refreshToken: hashRefreshToken(refreshToken),
        refreshTokenExpiresAt,
        lastLoginAt: new Date(),
        lastLoginMethod: 'email_password',
      })
      .where(eq(user.id, foundUser.id));

    this.logger.log(`User logged in: ${email}`);

    return new LoginResponseDTO({
      message: 'Login successful',
      accessToken,
      refreshToken,
    });
  }
}
