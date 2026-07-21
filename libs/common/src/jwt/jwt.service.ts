import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { StringValue } from 'ms';
import { IJWTPayload } from './interfaces/jwt-payload.interface';
@Injectable()
export class JwtService {
  private readonly logger = new Logger(JwtService.name);

  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateToken(payload: IJWTPayload): Promise<string> {
    const token = await this.jwtService.signAsync(payload);
    return token;
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const refreshToken = await this.jwtService.signAsync(
      { id: userId, type: 'refresh' },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<StringValue>('jwt.refreshExpires'),
      },
    );
    return refreshToken;
  }

  async generateEmailVerificationToken(email: string): Promise<string> {
    const token = await this.jwtService.signAsync(
      { email, type: 'email-verification' },
      {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<StringValue>('jwt.emailExpires'),
      },
    );
    return token;
  }

  async generatePasswordResetToken(email: string): Promise<string> {
    const token = await this.jwtService.signAsync(
      { email, type: 'password-reset' },
      {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<StringValue>('jwt.emailExpires'),
      },
    );
    return token;
  }

  async verifyPasswordResetToken(token: string): Promise<any> {
    try {
      const decoded = await this.jwtService.verifyAsync(token);
      if (decoded.type !== 'password-reset')
        throw new Error('Invalid token type');
      return decoded;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async verifyToken(token: string): Promise<any> {
    try {
      return this.jwtService.verifyAsync(token);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async verifyRefreshToken(token: string): Promise<any> {
    try {
      const decoded = await this.jwtService.verifyAsync(token);
      if (decoded.type !== 'refresh') throw new Error('Invalid token type');
      return decoded;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async verifyEmailToken(token: string): Promise<any> {
    try {
      const decoded = await this.jwtService.verifyAsync(token);
      if (decoded.type !== 'email-verification')
        throw new Error('Invalid token type');
      return decoded;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  decodeToken(token: string): IJWTPayload {
    const decode = this.jwtService.decode(token);
    if (!decode) throw new Error('Failed to decode token');
    return decode as IJWTPayload;
  }
}
