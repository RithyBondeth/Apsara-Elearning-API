import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { StringValue } from 'ms';
import {
  IActionTokenPayload,
  IJWTPayload,
  IRefreshTokenPayload,
} from './interfaces/jwt-payload.interface';
@Injectable()
export class JwtService {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateToken(payload: IJWTPayload): Promise<string> {
    const token = await this.jwtService.signAsync({
      ...payload,
      type: 'access',
    });
    return token;
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const refreshToken = await this.jwtService.signAsync(
      { id: userId, type: 'refresh' },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<StringValue>('jwt.refreshExpires'),
        issuer: this.configService.get<string>('jwt.issuer'),
        audience: this.configService.get<string>('jwt.audience'),
        algorithm: 'HS256',
      },
    );
    return refreshToken;
  }

  async generateEmailVerificationToken(email: string): Promise<string> {
    const token = await this.jwtService.signAsync(
      { email, type: 'email-verification' },
      {
        secret: this.configService.get<string>('jwt.actionSecret'),
        expiresIn: this.configService.get<StringValue>('jwt.emailExpires'),
        issuer: this.configService.get<string>('jwt.issuer'),
        audience: this.configService.get<string>('jwt.audience'),
        algorithm: 'HS256',
      },
    );
    return token;
  }

  async generatePasswordResetToken(email: string): Promise<string> {
    const token = await this.jwtService.signAsync(
      { email, type: 'password-reset' },
      {
        secret: this.configService.get<string>('jwt.actionSecret'),
        expiresIn: this.configService.get<StringValue>('jwt.emailExpires'),
        issuer: this.configService.get<string>('jwt.issuer'),
        audience: this.configService.get<string>('jwt.audience'),
        algorithm: 'HS256',
      },
    );
    return token;
  }

  async verifyPasswordResetToken(token: string): Promise<IActionTokenPayload> {
    try {
      const decoded = await this.verifyActionToken(token);
      if (decoded.type !== 'password-reset')
        throw new Error('Invalid token type');
      return decoded;
    } catch {
      throw new Error('Invalid or expired password reset token');
    }
  }

  async verifyToken(token: string): Promise<IJWTPayload> {
    try {
      const decoded = await this.jwtService.verifyAsync<IJWTPayload>(token, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        algorithms: ['HS256'],
        issuer: this.configService.get<string>('jwt.issuer'),
        audience: this.configService.get<string>('jwt.audience'),
      });
      if (
        decoded.type !== 'access' ||
        typeof decoded.id !== 'string' ||
        typeof decoded.info !== 'string' ||
        !['student', 'admin'].includes(decoded.role)
      ) {
        throw new Error('Invalid access token');
      }
      return decoded;
    } catch {
      throw new Error('Invalid or expired access token');
    }
  }

  async verifyRefreshToken(token: string): Promise<IRefreshTokenPayload> {
    try {
      const decoded = await this.jwtService.verifyAsync<IRefreshTokenPayload>(
        token,
        {
          secret: this.configService.get<string>('jwt.refreshSecret'),
          algorithms: ['HS256'],
          issuer: this.configService.get<string>('jwt.issuer'),
          audience: this.configService.get<string>('jwt.audience'),
        },
      );
      if (decoded.type !== 'refresh') throw new Error('Invalid token type');
      if (typeof decoded.id !== 'string')
        throw new Error('Invalid token subject');
      return decoded;
    } catch {
      throw new Error('Invalid or expired refresh token');
    }
  }

  async verifyEmailToken(token: string): Promise<IActionTokenPayload> {
    try {
      const decoded = await this.verifyActionToken(token);
      if (decoded.type !== 'email-verification')
        throw new Error('Invalid token type');
      return decoded;
    } catch {
      throw new Error('Invalid or expired email verification token');
    }
  }

  private async verifyActionToken(token: string): Promise<IActionTokenPayload> {
    const decoded = await this.jwtService.verifyAsync<IActionTokenPayload>(
      token,
      {
        secret: this.configService.get<string>('jwt.actionSecret'),
        algorithms: ['HS256'],
        issuer: this.configService.get<string>('jwt.issuer'),
        audience: this.configService.get<string>('jwt.audience'),
      },
    );
    if (typeof decoded.email !== 'string')
      throw new Error('Invalid token subject');
    return decoded;
  }
}
