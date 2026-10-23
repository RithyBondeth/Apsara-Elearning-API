import {
  BadRequestException,
  GatewayTimeoutException,
  type ArgumentsHost,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import * as Sentry from '@sentry/node';
import { RpcNotFoundException } from '../filters/rpc-exceptions';
import { RpcToHttpExceptionFilter } from '../filters/rpc-to-http.filter';
import { initErrorTracking, reportError } from './error-tracking';
import { ReportingRpcExceptionFilter } from './reporting-rpc-exception.filter';

jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
}));

/**
 * What reaches the error tracker: unexpected failures only. Deliberate
 * answers — a 404, a validation error, an RpcException — must not, or real
 * problems drown in expected noise.
 */
const capture = Sentry.captureException as jest.Mock;

function httpHost(): ArgumentsHost {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ method: 'GET', url: '/api/v1/internal/course' }),
    }),
  } as unknown as ArgumentsHost;
}

function rpcHost(pattern = 'course.find_published'): ArgumentsHost {
  return {
    getType: () => 'rpc',
    switchToRpc: () => ({ getContext: () => ({ getPattern: () => pattern }) }),
  } as unknown as ArgumentsHost;
}

describe('error tracking without a DSN', () => {
  it('stays off: nothing is initialised or sent', () => {
    delete process.env.SENTRY_DSN;
    initErrorTracking('api-gateway');
    reportError(new Error('boom'));

    expect(Sentry.init).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
  });
});

describe('error tracking with a DSN', () => {
  beforeAll(() => {
    process.env.SENTRY_DSN = 'https://key@o0.ingest.sentry.io/1';
    initErrorTracking('course-service');
  });
  afterAll(() => delete process.env.SENTRY_DSN);
  beforeEach(() => capture.mockClear());

  it('initialises errors-only, without personal data, tagged by service', () => {
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://key@o0.ingest.sentry.io/1',
        sendDefaultPii: false,
        tracesSampleRate: 0,
        initialScope: { tags: { service: 'course-service' } },
      }),
    );
  });

  describe('RabbitMQ services (ReportingRpcExceptionFilter)', () => {
    const filter = new ReportingRpcExceptionFilter();

    it('reports an unexpected error with its message pattern', async () => {
      const error = new Error('connection terminated');

      await expect(
        lastValueFrom(filter.catch(error, rpcHost())),
      ).rejects.toBeDefined();

      expect(capture).toHaveBeenCalledWith(error, {
        extra: { pattern: 'course.find_published' },
      });
    });

    it('does not report a deliberate RpcException', async () => {
      await expect(
        lastValueFrom(filter.catch(new RpcNotFoundException(), rpcHost())),
      ).rejects.toBeDefined();
      await expect(
        lastValueFrom(filter.catch(new RpcException('nope'), rpcHost())),
      ).rejects.toBeDefined();

      expect(capture).not.toHaveBeenCalled();
    });
  });

  describe('gateways (RpcToHttpExceptionFilter)', () => {
    const filter = new RpcToHttpExceptionFilter();

    it('reports a 5xx raised in the gateway, e.g. a service timeout', () => {
      const timeout = new GatewayTimeoutException();
      filter.catch(timeout, httpHost());

      expect(capture).toHaveBeenCalledWith(timeout, {
        extra: { method: 'GET', path: '/api/v1/internal/course' },
      });
    });

    it('reports an unknown error thrown in the gateway', () => {
      const bug = new TypeError('x is undefined');
      filter.catch(bug, httpHost());

      expect(capture).toHaveBeenCalledWith(bug, expect.anything());
    });

    it('does not report 4xx answers or structured service errors', () => {
      filter.catch(new BadRequestException('bad'), httpHost());
      filter.catch(
        { statusCode: 404, message: 'Course not found', error: 'Not Found' },
        httpHost(),
      );

      expect(capture).not.toHaveBeenCalled();
    });

    it('does not re-report the stack-less echo of a service error', () => {
      // The service already reported the original with its stack.
      filter.catch(
        { status: 'error', message: 'Internal server error' },
        httpHost(),
      );

      expect(capture).not.toHaveBeenCalled();
    });
  });
});
