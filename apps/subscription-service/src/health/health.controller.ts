import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { HealthCheckResult, HealthCheckService } from '@nestjs/terminus';
import { DrizzleHealthIndicator } from '@app/common';
import {
  HEALTH_PATTERN,
  IHealthRpcController,
  SUBSCRIPTION_SERVICE,
} from '@app/contracts';

@Controller()
export class SubscriptionHealthController implements IHealthRpcController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: DrizzleHealthIndicator,
  ) {}

  @MessagePattern(HEALTH_PATTERN)
  checkHealth(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.database.pingCheck('database'),
      () => ({
        [SUBSCRIPTION_SERVICE.NAME]: {
          status: 'up',
          message: 'Subscription service is ready',
        },
      }),
    ]);
  }
}
