import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PinoLogger } from 'nestjs-pino';
import type { Request, Response } from 'express';

/** Requests slower than this are logged at WARN so they stand out. */
const SLOW_REQUEST_MS = 1000;

/** Noisy paths we don't want a log line for on every hit. */
const SKIP_PATH_PREFIXES = ['/health', '/docs', '/favicon'];

/**
 * Logs how long every request takes — HTTP at the gateway (end-to-end,
 * including downstream RPC) and the individual @MessagePattern handlers inside
 * each microservice. Registered once globally via LoggerModule, so it covers
 * every app that imports it. Structured fields (durationMs, statusCode) make it
 * easy to grep/aggregate for p95 and to spot the slow service in a fan-out.
 */
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext('Timing');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const type = context.getType();
    const start = Date.now();

    if (type === 'http') {
      const req = context.switchToHttp().getRequest<Request>();
      const url = req.originalUrl || req.url || '';
      if (SKIP_PATH_PREFIXES.some((p) => url.startsWith(p))) {
        return next.handle();
      }
      const res = context.switchToHttp().getResponse<Response>();
      const method = req.method;
      const routePath = (req as unknown as { route?: { path?: unknown } }).route
        ?.path;
      const route =
        `${req.baseUrl || ''}${typeof routePath === 'string' ? routePath : ''}` ||
        'unmatched';
      return next.handle().pipe(
        tap({
          next: () => this.logHttp(method, url, route, res.statusCode, start),
          error: (error: unknown) =>
            this.logHttp(method, url, route, this.statusCodeOf(error), start),
        }),
      );
    }

    if (type === 'rpc') {
      // No HTTP status here — label by Controller.handler so latency can be
      // attributed to a specific service method.
      const label = `${context.getClass().name}.${context.getHandler().name}`;
      return next.handle().pipe(
        tap({
          next: () => this.logRpc(label, start, false),
          error: () => this.logRpc(label, start, true),
        }),
      );
    }

    return next.handle();
  }

  private statusCodeOf(error: unknown): number {
    if (!error || typeof error !== 'object') return 500;
    const record = error as Record<string, unknown>;
    const status = record.status ?? record.statusCode;
    return typeof status === 'number' ? status : 500;
  }

  private logHttp(
    method: string,
    url: string,
    route: string,
    statusCode: number,
    start: number,
  ): void {
    const durationMs = Date.now() - start;
    const payload = {
      kind: 'http',
      method,
      url,
      route,
      statusCode,
      durationMs,
    };
    const msg = `${method} ${url} ${statusCode} ${durationMs}ms`;
    if (statusCode >= 500) this.logger.error(payload, msg);
    else if (durationMs >= SLOW_REQUEST_MS || statusCode >= 400)
      this.logger.warn(payload, msg);
    else this.logger.info(payload, msg);
  }

  private logRpc(label: string, start: number, isError: boolean): void {
    const durationMs = Date.now() - start;
    const payload = { kind: 'rpc', handler: label, durationMs, isError };
    const msg = `${label} ${durationMs}ms${isError ? ' (error)' : ''}`;
    if (isError) this.logger.error(payload, msg);
    else if (durationMs >= SLOW_REQUEST_MS) this.logger.warn(payload, msg);
    else this.logger.info(payload, msg);
  }
}
