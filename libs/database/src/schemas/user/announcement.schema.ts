import {
  boolean,
  integer,
  pgTable,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { user } from './user.schema';
import { courses } from '../course/course.schema';

/**
 * An admin announcement — the sender's record of one message delivered to many
 * learners. Each recipient gets their own `notifications` row (type
 * 'announcement'); this row keeps what was said, to which audience, by whom,
 * and how many it reached. Matches migrations/20260930_add_announcements.sql.
 */
export const announcements = pgTable('announcements', {
  ...id,
  title: text('title').notNull(),
  body: text('body').notNull(),
  /** 'all' | 'course' — see ANNOUNCEMENT_AUDIENCES in @app/contracts. */
  audience: varchar('audience', { length: 16 }).notNull(),
  courseId: uuid('course_id').references(() => courses.id, {
    onDelete: 'set null',
  }),
  subscribersOnly: boolean('subscribers_only').notNull().default(false),
  recipientCount: integer('recipient_count').notNull().default(0),
  sentBy: uuid('sent_by').references(() => user.id, { onDelete: 'set null' }),
  ...timestamps,
});
