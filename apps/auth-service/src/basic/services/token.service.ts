import { Inject, Injectable, Logger } from '@nestjs/common';
import { ITokenService } from '@app/contracts';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { user } from '@app/database/schemas/user/user.schema';
import { and, eq } from 'drizzle-orm';
import { ConfigService } from '@nestjs/config';
import { DRIZZLE, MessageResponseDTO, LoginResponseDTO } from '@app/contracts';
import {
  hashRefreshToken,
  IJWTPayload,
  JwtService,
  RpcUnauthorizedException,
} from '@app/common';
import ms, { StringValue } from 'ms';

@Injectable()
export class TokenService implements ITokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async refresh(refreshToken: string): Promise<LoginResponseDTO> {
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

    const presentedTokenHash = hashRefreshToken(refreshToken);
    if (
      !foundUser ||
      foundUser.refreshToken !== presentedTokenHash ||
      !foundUser.refreshTokenExpiresAt ||
      foundUser.refreshTokenExpiresAt.getTime() < Date.now() ||
      !foundUser.isEmailVerified
    ) {
      throw new RpcUnauthorizedException('Invalid or expired refresh token');
    }

    // 3. Rotate tokens
    const jwtPayload: IJWTPayload = {
      id: foundUser.id,
      info: foundUser.email,
      type: 'access',
      role: foundUser.isAdmin ? 'admin' : 'student',
      isAdmin: foundUser.isAdmin,
    };

    const [accessToken, newRefreshToken] = await Promise.all([
      this.jwtService.generateToken(jwtPayload),
      this.jwtService.generateRefreshToken(foundUser.id),
    ]);

    const refreshExpiresStr =
      this.configService.get<string>('jwt.refreshExpires') ?? '7d';
    const refreshTokenExpiresAt = new Date(
      Date.now() + ms(refreshExpiresStr as StringValue),
    );

    // Compare-and-swap makes rotation single-use even when concurrent requests
    // present the same token at the same time.
    const rotated = await this.db
      .update(user)
      .set({
        refreshToken: hashRefreshToken(newRefreshToken),
        refreshTokenExpiresAt,
      })
      .where(
        and(
          eq(user.id, foundUser.id),
          eq(user.refreshToken, presentedTokenHash),
        ),
      )
      .returning({ id: user.id });

    if (rotated.length !== 1) {
      throw new RpcUnauthorizedException('Invalid or expired refresh token');
    }

    this.logger.log(`Tokens refreshed for: ${foundUser.email}`);

    return new LoginResponseDTO({
      message: 'Token refreshed successfully',
      accessToken,
      refreshToken: newRefreshToken,
    });
  }

  async logout(refreshToken: string): Promise<MessageResponseDTO> {
    try {
      const decoded = await this.jwtService.verifyRefreshToken(refreshToken);
      await this.db
        .update(user)
        .set({ refreshToken: null, refreshTokenExpiresAt: null })
        .where(
          and(
            eq(user.id, decoded.id),
            eq(user.refreshToken, hashRefreshToken(refreshToken)),
          ),
        );
      this.logger.log(`User logged out: ${decoded.id}`);
    } catch {
      // Logout is intentionally idempotent and does not disclose token state.
    }

    return new MessageResponseDTO({ message: 'Logged out successfully' });
  }
}
