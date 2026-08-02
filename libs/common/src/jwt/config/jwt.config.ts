import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
import { StringValue } from 'ms';

export const jwtConfig = (configService: ConfigService): JwtModuleOptions => ({
  secret: configService.get<string>('jwt.accessSecret'),
  signOptions: {
    expiresIn: configService.get<StringValue>('jwt.accessExpires'),
    issuer: configService.get<string>('jwt.issuer'),
    audience: configService.get<string>('jwt.audience'),
    algorithm: 'HS256',
  },
});
