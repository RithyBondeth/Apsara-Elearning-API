import { HealthCheckResult } from '@nestjs/terminus';

/**
 * Every microservice's health controller answers the HEALTH_PATTERN RPC with a
 * Terminus HealthCheckResult, which the gateway aggregates.
 */
export interface IHealthRpcController {
  checkHealth(): Promise<HealthCheckResult>;
}
