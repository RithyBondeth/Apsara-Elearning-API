import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
} from '@nestjs/terminus';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AI_SERVICE,
  ASSESSMENT_SERVICE,
  AUTH_SERVICE,
  COURSE_SERVICE,
  SUBSCRIPTION_SERVICE,
  USER_SERVICE,
} from '@app/contracts';
import { InternalServiceHealthIndicator } from '../indicators/internal-service.health';

/**
 * Public readiness endpoint. Fans the HEALTH_PATTERN out to every microservice
 * over RabbitMQ and reports the aggregate — the gateway itself holds no DB, so
 * its health is the health of the services behind it.
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly internal: InternalServiceHealthIndicator,
    @Inject(AUTH_SERVICE.NAME) private readonly authClient: ClientProxy,
    @Inject(USER_SERVICE.NAME) private readonly userClient: ClientProxy,
    @Inject(COURSE_SERVICE.NAME) private readonly courseClient: ClientProxy,
    @Inject(ASSESSMENT_SERVICE.NAME) private readonly assessmentClient: ClientProxy,
    @Inject(SUBSCRIPTION_SERVICE.NAME) private readonly subscriptionClient: ClientProxy,
    @Inject(AI_SERVICE.NAME) private readonly aiClient: ClientProxy,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Aggregate health of all microservices' })
  checkHealth(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.internal.pingService(AUTH_SERVICE.NAME, this.authClient),
      () => this.internal.pingService(USER_SERVICE.NAME, this.userClient),
      () => this.internal.pingService(COURSE_SERVICE.NAME, this.courseClient),
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
      () => this.internal.pingService(AI_SERVICE.NAME, this.aiClient),
    ]);
  }
}
