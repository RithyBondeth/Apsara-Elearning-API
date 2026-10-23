import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseRpcExceptionFilter, RpcException } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { reportError } from './error-tracking';

/**
 * Global filter for the RabbitMQ services. An RpcException is a deliberate
 * answer (404, 403, validation…) and is not reported; anything else is a bug
 * or an outage (a failed query, a thrown Error) and is reported with its
 * stack before Nest turns it into the usual "Internal server error" reply.
 */
@Catch()
export class ReportingRpcExceptionFilter extends BaseRpcExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): Observable<unknown> {
    if (!(exception instanceof RpcException)) {
      // RmqContext exposes the message pattern, e.g. "course.find_published".
      const context: { getPattern?: () => string } | undefined = host
        .switchToRpc()
        .getContext();
      reportError(exception, { pattern: context?.getPattern?.() });
    }
    return super.catch(exception, host);
  }
}
