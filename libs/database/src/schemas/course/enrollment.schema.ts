import { boolean, integer, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { user } from '../user/user.schema';
import { courses } from './course.schema';

export const enrollments = pgTable(
  'enrollments',
  {
    ...id,
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    courseId: uuid('course_id')
      .references(() => courses.id, { onDelete: 'cascade' })
      .notNull(),
    enrolledAt: timestamp('enrolled_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
    progressPercent: integer('progress_percent').notNull().default(0),
    completed: boolean('completed').default(false),
    ...timestamps,
  },
  (t) => [unique().on(t.userId, t.courseId)],
);
