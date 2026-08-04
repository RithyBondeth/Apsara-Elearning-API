import {
  index,
  pgTable,
  timestamp,
  unique,
  uuid,
  text,
} from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { user } from '../user/user.schema';
import { courses } from './course.schema';

/**
 * A course-completion certificate.
 *
 * `code` is the public verification handle printed on the certificate — anyone
 * holding it can check the certificate without signing in, which is the whole
 * point of issuing one.
 */
export const certificates = pgTable(
  'certificates',
  {
    ...id,
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    courseId: uuid('course_id')
      .references(() => courses.id, { onDelete: 'cascade' })
      .notNull(),
    code: text('code').notNull().unique(),
    issuedAt: timestamp('issued_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' }),
    ...timestamps,
  },
  (t) => [unique().on(t.userId, t.courseId), index().on(t.userId)],
);
