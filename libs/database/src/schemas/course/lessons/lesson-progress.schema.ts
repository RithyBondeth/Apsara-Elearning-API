import { boolean, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { id } from '../../common/id.schema';
import { timestamps } from '../../common/timestap.schema';
import { lessons } from './lesson.schema';
import { user } from '../../user/user.schema';

export const lessonProgress = pgTable(
  'lesson_progress',
  {
    ...id,
    lessonId: uuid('lesson_id')
      .references(() => lessons.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    completed: boolean('completed').default(false),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
    ...timestamps,
  },
  (t) => [unique().on(t.userId, t.lessonId)],
);
