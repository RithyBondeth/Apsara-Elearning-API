import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { user } from '@app/database/schemas/user/user.schema';
import { eq } from 'drizzle-orm';
import { ConfigService } from '@nestjs/config';
import {
  DRIZZLE,
  MessageResponseDTO,
  RegisterResponseDTO,
} from '@app/contracts';
import { IJWTPayload, JwtService, RpcUnauthorizedException } from '@app/common';
import ms from 'ms';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async refresh(refreshToken: string): Promise<RegisterResponseDTO> {
    // 1. Validate the refresh token signature/type
    let decoded: { id: string; type: string };
    try {
      decoded = await this.jwtService.verifyRefreshToken(refreshToken);
    } catch {
      throw new RpcUnauthorizedException('Invalid or expired refresh token');
    }

    // 2. Ensure the token still matches what we have stored
    const [foundUser] = await this.db
      .select()
      .from(user)
      .where(eq(user.id, decoded.id))
      .limit(1);

    if (
      !foundUser ||
      foundUser.refreshToken !== refreshToken ||
      !foundUser.refreshTokenExpiresAt ||
      foundUser.refreshTokenExpiresAt.getTime() < Date.now()
    ) {
      throw new RpcUnauthorizedException('Invalid or expired refresh token');
    }

    // 3. Rotate tokens
    const jwtPayload: IJWTPayload = {
      id: foundUser.id,
      info: foundUser.email,
    };

    const [accessToken, newRefreshToken] = await Promise.all([
      this.jwtService.generateToken(jwtPayload),
      this.jwtService.generateRefreshToken(foundUser.id),
    ]);

    const refreshExpiresStr =
      this.configService.get<string>('jwt.refreshExpires') ?? '7d';
    const refreshTokenExpiresAt = new Date(
      Date.now() + ms(refreshExpiresStr as any),
    );

    await this.db
      .update(user)
      .set({ refreshToken: newRefreshToken, refreshTokenExpiresAt })
      .where(eq(user.id, foundUser.id));

    this.logger.log(`Tokens refreshed for: ${foundUser.email}`);

    return new RegisterResponseDTO({
      message: 'Token refreshed successfully',
      accessToken,
      refreshToken: newRefreshToken,
    });
  }

  async logout(userId: string): Promise<MessageResponseDTO> {
    await this.db
      .update(user)
      .set({ refreshToken: null, refreshTokenExpiresAt: null })
      .where(eq(user.id, userId));

    this.logger.log(`User logged out: ${userId}`);

    return new MessageResponseDTO({ message: 'Logged out successfully' });
  }
}
