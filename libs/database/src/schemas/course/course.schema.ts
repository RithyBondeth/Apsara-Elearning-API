import { boolean, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { user } from '../user/user.schema';

export const courses = pgTable('courses', {
  ...id,
  title: text('title').notNull(),
  description: text('description'),
  slug: text('slug').notNull(),
  thumbnail: text('thumbnail'),
  ...timestamps,
  estimatedHours: integer('estimated_hours'),
  published: boolean('published').default(true),
  createdBy: uuid('created_by').references(() => user.id),
});
