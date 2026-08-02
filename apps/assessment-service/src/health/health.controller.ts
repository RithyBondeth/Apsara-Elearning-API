import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { HealthCheckResult, HealthCheckService } from '@nestjs/terminus';
import { DrizzleHealthIndicator } from '@app/common';
import {
  ASSESSMENT_SERVICE,
  HEALTH_PATTERN,
  IHealthRpcController,
} from '@app/contracts';

@Controller()
export class AssessmentHealthController implements IHealthRpcController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: DrizzleHealthIndicator,
  ) {}

  @MessagePattern(HEALTH_PATTERN)
  checkHealth(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.database.pingCheck('database'),
      () => ({
        [ASSESSMENT_SERVICE.NAME]: {
          status: 'up',
          message: 'Assessment service is ready',
        },
      }),
    ]);
  }
}
