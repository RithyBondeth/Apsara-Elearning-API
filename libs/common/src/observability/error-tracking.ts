import * as Sentry from '@sentry/node';

let enabled = false;

/** Headers that carry credentials or a client's identity. */
const SENSITIVE_HEADERS = new Set([
  'cookie',
  'set-cookie',
  'authorization',
  'x-apsara-proxy-secret',
  'x-apsara-client-ip',
  'x-forwarded-for',
  'x-real-ip',
]);

/**
 * Last line of defence before an event leaves the service. The web app's
 * SDK attached session cookies and the Authorization header to events even
 * with sendDefaultPii off, so request data is stripped here too: cookies,
 * bodies, credential headers, query strings and user fields.
 */
export function scrubEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  const request = event.request;
  if (request) {
    delete request.cookies;
    delete request.data;
    delete request.query_string;
    if (request.url) request.url = request.url.split(/[?#]/)[0];
    if (request.headers) {
      for (const name of Object.keys(request.headers)) {
        if (SENSITIVE_HEADERS.has(name.toLowerCase())) {
          delete request.headers[name];
        }
      }
    }
  }
  delete event.user;
  return event;
}

/**
 * Starts error reporting for one service — a no-op without SENTRY_DSN, so
 * local development and tests send nothing.
 *
 * Errors only: tracing stays off (cost), and every event passes through
 * scrubEvent so credentials and learners' data stay out of the tracker. Uncaught exceptions and unhandled rejections are
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
    beforeSend: scrubEvent,
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
