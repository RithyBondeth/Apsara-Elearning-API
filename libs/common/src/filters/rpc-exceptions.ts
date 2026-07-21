import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

/**
 * Shape carried across RabbitMQ so the gateway can rebuild a proper HTTP
 * response. Mirrors Nest's default HttpException body.
 */
export interface IRpcErrorPayload {
  statusCode: number;
  message: string | string[];
  error: string;
}

/**
 * Base RPC exception that serializes a status code alongside the message.
 * Services should throw these instead of `new RpcException('string')` so the
 * gateway can map them to the correct HTTP status (otherwise everything
 * surfaces as 500).
 */
export class RpcAppException extends RpcException {
  constructor(statusCode: number, message: string | string[], error: string) {
    super({ statusCode, message, error } satisfies IRpcErrorPayload);
  }
}

export class RpcBadRequestException extends RpcAppException {
  constructor(message: string | string[] = 'Bad Request') {
    super(HttpStatus.BAD_REQUEST, message, 'Bad Request');
  }
}

export class RpcUnauthorizedException extends RpcAppException {
  constructor(message: string | string[] = 'Unauthorized') {
    super(HttpStatus.UNAUTHORIZED, message, 'Unauthorized');
  }
}

export class RpcForbiddenException extends RpcAppException {
  constructor(message: string | string[] = 'Forbidden') {
    super(HttpStatus.FORBIDDEN, message, 'Forbidden');
  }
}

export class RpcNotFoundException extends RpcAppException {
  constructor(message: string | string[] = 'Not Found') {
    super(HttpStatus.NOT_FOUND, message, 'Not Found');
  }
}

export class RpcConflictException extends RpcAppException {
  constructor(message: string | string[] = 'Conflict') {
    super(HttpStatus.CONFLICT, message, 'Conflict');
  }
}

export class RpcInternalException extends RpcAppException {
  constructor(message: string | string[] = 'Internal server error') {
    super(HttpStatus.INTERNAL_SERVER_ERROR, message, 'Internal Server Error');
  }
}

/** Type guard for an error forwarded from a microservice. */
export function isRpcErrorPayload(value: unknown): value is IRpcErrorPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as IRpcErrorPayload).statusCode === 'number' &&
    'message' in value
  );
}
