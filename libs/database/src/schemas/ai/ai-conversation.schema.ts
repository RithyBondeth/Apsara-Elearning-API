import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { user } from '../user/user.schema';
import { lessons } from '../course/lessons/lesson.schema';
import { courses } from '../course/course.schema';

export const aiConversations = pgTable('ai_conversations', {
  ...id,
  userId: uuid('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  courseId: uuid('course_id').references(() => courses.id, {
    onDelete: 'set null',
  }),
  lessonId: uuid('lesson_id').references(() => lessons.id, {
    onDelete: 'set null',
  }),
  title: text('title').notNull(),
  ...timestamps,
});
