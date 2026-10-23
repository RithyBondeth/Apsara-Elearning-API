import * as Sentry from '@sentry/node';

let enabled = false;

/**
 * Starts error reporting for one service — a no-op without SENTRY_DSN, so
 * local development and tests send nothing.
 *
 * Errors only: tracing stays off (cost), and no request bodies, cookies or IP
 * addresses are attached (sendDefaultPii: false) — learners' data stays out
 * of the error tracker. Uncaught exceptions and unhandled rejections are
 * captured by the SDK's default handlers.
 */
export function initErrorTracking(service: string): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    // Railway sets this on every deploy, so an error maps to a commit.
    release: process.env.RAILWAY_GIT_COMMIT_SHA,
    serverName: service,
    initialScope: { tags: { service } },
    sendDefaultPii: false,
    tracesSampleRate: 0,
  });
  enabled = true;
}

/** Reports an unexpected error; does nothing when tracking is off. */
export function reportError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!enabled) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
