import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { courses } from './course.schema';

export const modules = pgTable('modules', {
  ...id,
  courseId: uuid('course_id').references(() => courses.id),
  title: text('title').notNull(),
  description: text('description'),
  ...timestamps,
});
