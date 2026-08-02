import { GatewayTimeoutException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, TimeoutError } from 'rxjs';

const DEFAULT_TIMEOUT_MS = 10000;

export async function rpcCall<T = any>(
  client: ClientProxy,
  pattern: string | Record<string, unknown>,
  payload: unknown,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  try {
    return await firstValueFrom(
      client.send<T>(pattern, payload).pipe(timeout(timeoutMs)),
    );
  } catch (error) {
    if (error instanceof TimeoutError) {
      throw new GatewayTimeoutException(
        'Service timeout. Please try again later.',
      );
    }
    throw error;
  }
}
