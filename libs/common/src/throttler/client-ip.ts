import { timingSafeEqual } from 'crypto';

/**
 * Header the web app's BFF uses to declare the browser's real IP, and the
 * shared secret that proves the call actually came from the BFF.
 */
export const CLIENT_IP_HEADER = 'x-apsara-client-ip';
export const PROXY_SECRET_HEADER = 'x-apsara-proxy-secret';

/** The shape we need off an Express request — kept structural so it is testable. */
export interface IRequestLike {
  ip?: string;
  socket?: { remoteAddress?: string };
  headers?: Record<string, string | string[] | undefined>;
}

function header(req: IRequestLike, name: string): string | undefined {
  const value = req.headers?.[name];
  return Array.isArray(value) ? value[0] : value;
}

/** Constant-time compare that tolerates different lengths. */
function secretMatches(presented: string, expected: string): boolean {
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * The IP a rate limiter should bucket this request under.
 *
 * Every browser call reaches the gateway through the web app's BFF proxy, so
 * the socket address is always the BFF's — bucketing on it would put the entire
 * user base in one bucket and let a single busy page lock everyone out.
 *
 * `X-Forwarded-For` alone can't be trusted (any caller can forge it), so the
 * BFF instead declares the client IP explicitly and authenticates itself with a
 * shared secret. Without `INTERNAL_PROXY_SECRET` configured the header is
 * ignored entirely and we fall back to the socket address.
 */
export function resolveClientIp(
  req: IRequestLike,
  proxySecret?: string | null,
): string {
  const direct = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
  if (!proxySecret) return direct;

  const presented = header(req, PROXY_SECRET_HEADER);
  if (!presented || !secretMatches(presented, proxySecret)) return direct;

  return header(req, CLIENT_IP_HEADER)?.trim() || direct;
}
