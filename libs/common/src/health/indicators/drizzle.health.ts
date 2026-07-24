import { Inject, Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicatorResult } from '@nestjs/terminus';
import { sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '@app/contracts';

/**
 * Drizzle equivalent of Terminus' TypeOrmHealthIndicator: runs a trivial
 * `SELECT 1` against the postgres-js pool so readiness reflects real DB
 * reachability, not just that the process is alive.
 */
@Injectable()
export class DrizzleHealthIndicator {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.db.execute(sql`SELECT 1`);
      return { [key]: { status: 'up' } };
    } catch (error) {
      throw new HealthCheckError('Drizzle health check failed', {
        [key]: { status: 'down', message: (error as Error).message },
      });
    }
  }
}
