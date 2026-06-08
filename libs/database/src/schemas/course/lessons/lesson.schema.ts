import { integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { id } from '../../common/id.schema';
import { timestamps } from '../../common/timestap.schema';
import { modules } from '../module.schema';

export const lessons = pgTable('lessons', {
  ...id,
  moduleId: uuid('module_id').references(() => modules.id),
  title: text('title').notNull(),
  description: text('description'),
  slug: text('slug').notNull(),
  content: text('content'),
  estimatedMinutes: integer('estimated_minutes'),
  ...timestamps,
});
