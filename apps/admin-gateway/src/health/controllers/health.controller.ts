import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
} from '@nestjs/terminus';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InternalServiceHealthIndicator } from '@app/common';
import {
  ASSESSMENT_SERVICE,
  COURSE_SERVICE,
  SUBSCRIPTION_SERVICE,
  USER_SERVICE,
} from '@app/contracts';

/**
 * Admin readiness endpoint. The admin-gateway only proxies to course, user,
 * assessment and subscription, so it reports the aggregate health of those four
 * over RabbitMQ (taxonomy lives inside course-service).
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly internal: InternalServiceHealthIndicator,
    @Inject(COURSE_SERVICE.NAME) private readonly courseClient: ClientProxy,
    @Inject(USER_SERVICE.NAME) private readonly userClient: ClientProxy,
    @Inject(ASSESSMENT_SERVICE.NAME) private readonly assessmentClient: ClientProxy,
    @Inject(SUBSCRIPTION_SERVICE.NAME) private readonly subscriptionClient: ClientProxy,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Aggregate health of admin-facing microservices' })
  checkHealth(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.internal.pingService(COURSE_SERVICE.NAME, this.courseClient),
      () => this.internal.pingService(USER_SERVICE.NAME, this.userClient),
      () =>
        this.internal.pingService(
          ASSESSMENT_SERVICE.NAME,
          this.assessmentClient,
        ),
      () =>
        this.internal.pingService(
          SUBSCRIPTION_SERVICE.NAME,
          this.subscriptionClient,
        ),
    ]);
  }
}
