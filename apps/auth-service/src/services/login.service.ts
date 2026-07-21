import { LoginRequestDTO, LoginResponseDTO } from '@app/contracts';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { user } from '@app/database/schemas/user/user.schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { DRIZZLE } from '@app/contracts';
import {
  IJWTPayload,
  JwtService,
  RpcForbiddenException,
  RpcUnauthorizedException,
} from '@app/common';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';

@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);

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
      .where(eq(user.email, email))
      .limit(1);

    if (!foundUser) {
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
      Date.now() + ms(refreshExpiresStr as any),
    );

    await this.db
      .update(user)
      .set({
        refreshToken,
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
