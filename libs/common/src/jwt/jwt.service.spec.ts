import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { validationSchema } from '../config/validation.schema';
import { JwtService } from './jwt.service';
import { hashRefreshToken, refreshTokenHashMatches } from './token-hash';

const settings = {
  jwt: {
    accessSecret: 'a'.repeat(32),
    accessExpires: '15m',
    refreshSecret: 'b'.repeat(32),
    actionSecret: 'c'.repeat(32),
    refreshExpires: '7d',
    emailExpires: '1h',
    issuer: 'apsara-elearning',
    audience: 'apsara-elearning-web',
  },
};

describe('JwtService security boundaries', () => {
  const config = new ConfigService(settings);
  const nestJwt = new NestJwtService({
    secret: settings.jwt.accessSecret,
    signOptions: {
      expiresIn: '15m',
      issuer: settings.jwt.issuer,
      audience: settings.jwt.audience,
    },
  });
  const service = new JwtService(nestJwt, config);

  it('issues and verifies a typed access token', async () => {
    const token = await service.generateToken({
      id: 'user-1',
      info: 'user@example.com',
      type: 'access',
      role: 'student',
      isAdmin: false,
    });

    await expect(service.verifyToken(token)).resolves.toMatchObject({
      id: 'user-1',
      info: 'user@example.com',
      type: 'access',
      role: 'student',
    });
  });

  it('never accepts an action token as an access token', async () => {
    const token = await service.generatePasswordResetToken('user@example.com');
    await expect(service.verifyToken(token)).rejects.toThrow();
  });

  it('verifies refresh tokens with only the refresh secret', async () => {
    const token = await service.generateRefreshToken('user-1');

    await expect(service.verifyRefreshToken(token)).resolves.toMatchObject({
      id: 'user-1',
      type: 'refresh',
    });
    await expect(
      nestJwt.verifyAsync(token, { secret: settings.jwt.accessSecret }),
    ).rejects.toThrow();
  });

  it('rejects a refresh-shaped token signed with the access secret', async () => {
    const forged = await nestJwt.signAsync(
      { id: 'user-1', type: 'refresh' },
      {
        secret: settings.jwt.accessSecret,
        expiresIn: '1h',
        issuer: settings.jwt.issuer,
        audience: settings.jwt.audience,
      },
    );

    await expect(service.verifyRefreshToken(forged)).rejects.toThrow();
  });

  it('hashes stored bearer tokens and compares their digests safely', () => {
    const raw = 'secret-refresh-token';
    const digest = hashRefreshToken(raw);

    expect(digest).not.toContain(raw);
    expect(digest).toHaveLength(64);
    expect(refreshTokenHashMatches(raw, digest)).toBe(true);
    expect(refreshTokenHashMatches('different', digest)).toBe(false);
  });
});

describe('authentication configuration', () => {
  const baseEnvironment = {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgres://localhost/test',
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    JWT_ACCESS_EXPIRES: '15m',
    JWT_REFRESH_SECRET: 'b'.repeat(32),
    JWT_REFRESH_EXPIRES: '7d',
    JWT_ACTION_SECRET: 'c'.repeat(32),
    RABBITMQ_URL: 'amqp://localhost',
    AUTH_QUEUE: 'auth',
    USER_QUEUE: 'user',
    COURSE_QUEUE: 'course',
    ASSESSMENT_QUEUE: 'assessment',
    SUBSCRIPTION_QUEUE: 'subscription',
    AI_QUEUE: 'ai',
    RESEND_API_KEY: 'test-key',
    EMAIL_FROM: 'noreply@example.com',
    CORS_ORIGINS: 'https://example.com',
  };

  it('rejects reuse of one JWT secret for access and refresh tokens', () => {
    const { error } = validationSchema.validate({
      ...baseEnvironment,
      JWT_REFRESH_SECRET: baseEnvironment.JWT_ACCESS_SECRET,
    });
    expect(error).toBeDefined();
  });

  it('requires an explicit CORS allowlist in production', () => {
    const withoutCors: Partial<typeof baseEnvironment> = { ...baseEnvironment };
    delete withoutCors.CORS_ORIGINS;
    const { error } = validationSchema.validate(withoutCors);
    expect(error).toBeDefined();
  });
});
