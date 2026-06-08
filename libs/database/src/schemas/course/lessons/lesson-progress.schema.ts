import { boolean, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { id } from '../../common/id.schema';
import { timestamps } from '../../common/timestap.schema';
import { lessons } from './lesson.schema';
import { user } from '../../user/user.schema';

export const lessonProgress = pgTable('lesson_progress', {
  ...id,
  lessonId: uuid('lesson_id').references(() => lessons.id),
  userId: uuid('user_id').references(() => user.id),
  completed: boolean('completed').default(false),
  completedAt: timestamp('completed_at'),
  ...timestamps,
});
