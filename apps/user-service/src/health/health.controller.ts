import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { HealthCheckResult, HealthCheckService } from '@nestjs/terminus';
import { DrizzleHealthIndicator } from '@app/common';
import {
  HEALTH_PATTERN,
  IHealthRpcController,
  USER_SERVICE,
} from '@app/contracts';

@Controller()
export class UserHealthController implements IHealthRpcController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: DrizzleHealthIndicator,
  ) {}

  @MessagePattern(HEALTH_PATTERN)
  checkHealth(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.database.pingCheck('database'),
      () => ({
        [USER_SERVICE.NAME]: {
          status: 'up',
          message: 'User service is ready',
        },
      }),
    ]);
  }
}
