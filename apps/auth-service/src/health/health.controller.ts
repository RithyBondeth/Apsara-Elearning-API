import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { HealthCheckResult, HealthCheckService } from '@nestjs/terminus';
import { DrizzleHealthIndicator } from '@app/common';
import {
  AUTH_SERVICE,
  HEALTH_PATTERN,
  IHealthRpcController,
} from '@app/contracts';

@Controller()
export class AuthHealthController implements IHealthRpcController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: DrizzleHealthIndicator,
  ) {}

  @MessagePattern(HEALTH_PATTERN)
  checkHealth(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.database.pingCheck('database'),
      () => ({
        [AUTH_SERVICE.NAME]: {
          status: 'up',
          message: 'Auth service is ready',
        },
      }),
    ]);
  }
}
