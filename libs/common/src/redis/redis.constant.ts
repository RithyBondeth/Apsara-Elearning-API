/**
 * DI token for the shared ioredis client. It resolves to `null` when REDIS_URL
 * is unset, so Redis stays an optional dependency (rate limiting falls back to
 * in-memory, caching becomes a no-op) rather than a hard requirement for boot.
 */
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
