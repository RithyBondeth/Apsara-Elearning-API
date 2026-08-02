import { ConfigService } from '@nestjs/config';

/**
 * Resolves the CORS allow-list shared by both gateways.
 *
 * `CORS_ORIGINS` is a comma-separated list. Outside production an unset value
 * falls back to `'*'` so local tooling and Swagger keep working. In production
 * that fallback is a hole — a wildcard origin lets any site read authenticated
 * responses — so a missing value is a boot failure rather than a warning
 * somebody has to notice in the logs.
 */
export function resolveCorsOrigin(
  configService: ConfigService,
): string | string[] {
  const raw = configService.get<string>('cors.origins');
  const origins = raw
    ? raw
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [];

  if (origins.length) return origins;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'CORS_ORIGINS must be set in production — refusing to start with a wildcard CORS policy.',
    );
  }

  return '*';
}
