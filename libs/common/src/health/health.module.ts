import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { DatabaseModule } from '@app/database';
import { DrizzleHealthIndicator } from './indicators/drizzle.health';

/**
 * Shared health wiring. A service imports this, then exposes a health controller
 * that answers the HEALTH_PATTERN RPC using Terminus + the Drizzle indicator.
 */
@Module({
  imports: [TerminusModule, DatabaseModule],
  providers: [DrizzleHealthIndicator],
  exports: [DrizzleHealthIndicator, TerminusModule],
})
export class HealthModule {}
