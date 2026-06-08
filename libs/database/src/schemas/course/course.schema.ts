import { boolean, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { categories } from './category.schema';

export const courses = pgTable('courses', {
  ...id,
  categoryId: uuid('category_id').references(() => categories.id, {
    onDelete: 'set null',
  }),
  title: text('title').notNull(),
  description: text('description'),
  slug: text('slug').notNull().unique(),
  thumbnail: text('thumbnail'),
  estimatedHours: integer('estimated_hours'),
  published: boolean('published').default(false),
  ...timestamps,
});
