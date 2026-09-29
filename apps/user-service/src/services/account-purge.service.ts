import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, eq, lte } from 'drizzle-orm';
import { user } from '@app/database/schemas/user/user.schema';
import {
  ACCOUNT_DELETION_GRACE_DAYS,
  DRIZZLE,
  SUBSCRIPTION_SERVICE,
} from '@app/contracts';
import { rpcCall } from '@app/common';

const PURGE_INTERVAL_MS = 60 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 60 * 1000;
const BATCH_SIZE = 100;

/**
 * Deletes accounts whose self-service deletion grace period has run out.
 *
 * Runs hourly in-process. It's safe with several user-service replicas: each
 * step is idempotent, and the delete re-checks the request is still due, so
 * a learner who signs in (cancelling) at the last moment isn't deleted.
 *
 * Renewals are stopped again right before deleting, and an account whose
 * renewals can't be confirmed stopped is skipped until the next run — never
 * delete someone Stripe would keep charging. Deleting the user row cascades
 * to all of their data.
 */
@Injectable()
export class AccountPurgeService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(AccountPurgeService.name);
  private readonly timers: NodeJS.Timeout[] = [];
  private running = false;

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    @Inject(SUBSCRIPTION_SERVICE.NAME)
    private readonly subscriptionClient: ClientProxy,
  ) {}

  onApplicationBootstrap(): void {
    const run = () => void this.purgeDue();
    this.timers.push(
      setTimeout(run, FIRST_RUN_DELAY_MS).unref(),
      setInterval(run, PURGE_INTERVAL_MS).unref(),
    );
  }

  onModuleDestroy(): void {
    this.timers.forEach((t) => clearTimeout(t));
  }

  async purgeDue(
    now = new Date(),
  ): Promise<{ purged: number; skipped: number }> {
    if (this.running) return { purged: 0, skipped: 0 };
    this.running = true;
    let purged = 0;
    let skipped = 0;
    try {
      const cutoff = new Date(
        now.getTime() - ACCOUNT_DELETION_GRACE_DAYS * 86_400_000,
      );
      const due = await this.db
        .select({ id: user.id })
        .from(user)
        .where(lte(user.deletionRequestedAt, cutoff))
        .limit(BATCH_SIZE);

      for (const { id } of due) {
        try {
          await rpcCall(
            this.subscriptionClient,
            SUBSCRIPTION_SERVICE.ACTIONS.SUBSCRIPTION_STOP_RENEWALS,
            { userId: id },
            30_000,
          );
        } catch (error) {
          skipped++;
          this.logger.warn(
            `Not purging ${id} yet — couldn't confirm renewals stopped: ${error instanceof Error ? error.message : error}`,
          );
          continue;
        }

        const [deleted] = await this.db
          .delete(user)
          .where(and(eq(user.id, id), lte(user.deletionRequestedAt, cutoff)))
          .returning({ id: user.id });
        if (deleted) purged++;
      }

      if (purged || skipped) {
        this.logger.log(
          `Account purge: ${purged} deleted, ${skipped} deferred`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Account purge failed: ${error instanceof Error ? error.message : error}`,
      );
    } finally {
      this.running = false;
    }
    return { purged, skipped };
  }
}
