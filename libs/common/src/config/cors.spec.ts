import { ConfigService } from '@nestjs/config';
import { resolveCorsOrigin } from './cors';

function configWith(value?: string): ConfigService {
  return { get: () => value } as unknown as ConfigService;
}

describe('resolveCorsOrigin', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('splits and trims a comma-separated list', () => {
    expect(
      resolveCorsOrigin(configWith(' https://a.com , https://b.com ')),
    ).toEqual(['https://a.com', 'https://b.com']);
  });

  it('drops empty entries from a trailing comma', () => {
    expect(resolveCorsOrigin(configWith('https://a.com,'))).toEqual([
      'https://a.com',
    ]);
  });

  it('falls back to a wildcard outside production', () => {
    process.env.NODE_ENV = 'development';
    expect(resolveCorsOrigin(configWith(undefined))).toBe('*');
  });

  it('refuses to start in production without an allow-list', () => {
    process.env.NODE_ENV = 'production';
    expect(() => resolveCorsOrigin(configWith(undefined))).toThrow(
      /CORS_ORIGINS must be set/,
    );
  });

  it('treats a whitespace-only value as unset in production', () => {
    process.env.NODE_ENV = 'production';
    expect(() => resolveCorsOrigin(configWith(' , '))).toThrow(
      /CORS_ORIGINS must be set/,
    );
  });
});
