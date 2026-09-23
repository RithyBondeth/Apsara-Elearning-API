import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { user } from './user.schema';

/**
 * An in-app notification.
 *
 * `type` is free text carrying a `NotificationType` from @app/contracts rather
 * than a pg enum — the same choice `courses.requiredEntitlement` makes. New
 * notification kinds arrive with new features, and a pg enum would make every
 * one of them a migration.
 *
 * `data` holds the deep-link payload for the row (a courseId, a badgeId, a
 * certificate code) so the client can route without a second lookup.
 *
 * `readAt` is a nullable timestamp rather than a boolean: knowing *when*
 * something was read costs nothing here and a boolean cannot be recovered into
 * one later.
 */
export const notifications = pgTable(
  'notifications',
  {
    ...id,
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    type: text('type').notNull(),
    title: text('title').notNull(),
    body: text('body'),
    data: jsonb('data').$type<Record<string, unknown>>(),
    readAt: timestamp('read_at', { withTimezone: true, mode: 'date' }),
    ...timestamps,
  },
  // Named explicitly so the hand-written migration and a later `db:push` agree.
  // The feed is always "this user's rows, newest first", so the index carries
  // both columns.
  (t) => [
    index('notifications_user_id_created_at_index').on(t.userId, t.createdAt),
  ],
);
