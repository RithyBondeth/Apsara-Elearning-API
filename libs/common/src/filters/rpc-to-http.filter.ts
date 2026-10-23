import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { isRpcErrorPayload } from './rpc-exceptions';
import { reportError } from '../observability/error-tracking';

/**
 * What a RabbitMQ service replies when one of its handlers throws something
 * other than an RpcException. That service's ReportingRpcExceptionFilter has
 * already reported the original error with its stack, so the gateway doesn't
 * report this stack-less echo a second time.
 */
const isForwardedServiceError = (value: unknown): boolean =>
  typeof value === 'object' &&
  value !== null &&
  (value as { status?: unknown }).status === 'error';

/**
 * Global gateway filter. Microservice errors arrive as plain objects (the
 * payload from a thrown RpcException), which Nest's default handling turns
 * into a 500. This maps:
 *   - structured RPC payloads ({ statusCode, message, error }) → that status
 *   - native HttpExceptions (guards, validation, timeouts) → passthrough
 *   - anything else → 500
 *
 * Failures that start in the gateway itself (a service timing out, a bug
 * here) are reported to error tracking; expected 4xx answers are not.
 */
@Catch()
export class RpcToHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcToHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number;
    let message: string | string[];
    let error: string;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      if (statusCode >= 500) {
        reportError(exception, { method: request.method, path: request.url });
      }
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
        error = HttpStatus[statusCode] ?? 'Error';
      } else {
        const body = res as Record<string, unknown>;
        message =
          typeof body.message === 'string' || Array.isArray(body.message)
            ? (body.message as string | string[])
            : exception.message;
        error =
          typeof body.error === 'string'
            ? body.error
            : (HttpStatus[statusCode] ?? 'Error');
      }
    } else if (isRpcErrorPayload(exception)) {
      statusCode = exception.statusCode;
      message = exception.message;
      error = exception.error ?? HttpStatus[statusCode] ?? 'Error';
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'Internal Server Error';
      if (!isForwardedServiceError(exception)) {
        reportError(exception, { method: request.method, path: request.url });
      }
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error
          ? exception.stack
          : JSON.stringify(exception),
      );
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
