import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { notifications } from '@app/database/schemas/user/notification.schema';
import {
  CreateNotificationDTO,
  DRIZZLE,
  INotificationService,
  MarkReadResponseDTO,
  NotificationListResponseDTO,
  NotificationResponseDTO,
} from '@app/contracts';
import { RpcNotFoundException } from '@app/common';

@Injectable()
export class NotificationService implements INotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

  async create(dto: CreateNotificationDTO): Promise<NotificationResponseDTO> {
    const [created] = await this.db
      .insert(notifications)
      .values({
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body ?? null,
        data: dto.data ?? null,
      })
      .returning();
    this.logger.log(`Notification "${dto.type}" raised for ${dto.userId}`);
    return this.toDTO(created);
  }

  /**
   * The learner's feed, newest first.
   *
   * `unreadCount` is counted separately rather than derived from `items`: it
   * drives the bell badge, so it has to reflect everything unread, not just
   * what fitted on this page.
   */
  async findByUser(
    userId: string,
    limit: number,
    unreadOnly: boolean,
  ): Promise<NotificationListResponseDTO> {
    const where = unreadOnly
      ? and(eq(notifications.userId, userId), isNull(notifications.readAt))
      : eq(notifications.userId, userId);

    const rows = await this.db
      .select()
      .from(notifications)
      .where(where)
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return new NotificationListResponseDTO({
      items: rows.map((row) => this.toDTO(row)),
      unreadCount: await this.unreadCount(userId),
    });
  }

  /**
   * Marks one notification read.
   *
   * Scoped by userId as well as id so a guessed id cannot touch someone else's
   * row — the gateway resolves the user from the JWT, never from the request.
   * Already-read rows are left alone so `readAt` keeps the first read time.
   */
  async markRead(userId: string, id: string): Promise<MarkReadResponseDTO> {
    const updated = await this.db
      .update(notifications)
      .set({ readAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, userId),
          isNull(notifications.readAt),
        ),
      )
      .returning({ id: notifications.id });

    if (updated.length === 0) {
      // Either it does not exist, belongs to someone else, or was already read.
      // Distinguishing the first two would leak whose it is, so confirm the row
      // is the caller's before reporting "already read".
      const [own] = await this.db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(eq(notifications.id, id), eq(notifications.userId, userId)),
        )
        .limit(1);
      if (!own) throw new RpcNotFoundException('Notification not found');
    }

    return new MarkReadResponseDTO({
      updated: updated.length,
      unreadCount: await this.unreadCount(userId),
    });
  }

  async markAllRead(userId: string): Promise<MarkReadResponseDTO> {
    const updated = await this.db
      .update(notifications)
      .set({ readAt: new Date(), updatedAt: new Date() })
      .where(
        and(eq(notifications.userId, userId), isNull(notifications.readAt)),
      )
      .returning({ id: notifications.id });

    return new MarkReadResponseDTO({ updated: updated.length, unreadCount: 0 });
  }

  private async unreadCount(userId: string): Promise<number> {
    const [counted] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), isNull(notifications.readAt)),
      );
    return Number(counted?.count ?? 0);
  }

  private toDTO(
    row: typeof notifications.$inferSelect,
  ): NotificationResponseDTO {
    return new NotificationResponseDTO({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      data: row.data,
      readAt: row.readAt,
      createdAt: row.createdAt,
    });
  }
}
