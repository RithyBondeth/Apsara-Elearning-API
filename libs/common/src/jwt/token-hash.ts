import { createHash, timingSafeEqual } from 'node:crypto';

/** Refresh tokens are bearer credentials; persist only a one-way digest. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export const hashRefreshToken = hashToken;

export function refreshTokenHashMatches(
  token: string,
  storedHash: string,
): boolean {
  const candidate = Buffer.from(hashToken(token), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  return (
    candidate.length === stored.length && timingSafeEqual(candidate, stored)
  );
}
