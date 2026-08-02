import { Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { HealthCheckError, HealthIndicatorResult } from '@nestjs/terminus';
import { firstValueFrom, timeout } from 'rxjs';
import { HEALTH_PATTERN } from '@app/contracts';
import { HEALTH_RPC_TIMEOUT_MS } from '../constants';

/**
 * RMQ counterpart of Terminus' MicroserviceHealthIndicator: sends the
 * HEALTH_PATTERN to a microservice's queue and marks it down if the service
 * doesn't answer within HEALTH_RPC_TIMEOUT_MS.
 */
@Injectable()
export class InternalServiceHealthIndicator {
  async pingService(
    key: string,
    client: ClientProxy,
  ): Promise<HealthIndicatorResult> {
    try {
      await firstValueFrom(
        client.send(HEALTH_PATTERN, {}).pipe(timeout(HEALTH_RPC_TIMEOUT_MS)),
      );
      return { [key]: { status: 'up' } };
    } catch (error) {
      throw new HealthCheckError(`${key} is unreachable`, {
        [key]: { status: 'down', message: (error as Error).message },
      });
    }
  }
}
