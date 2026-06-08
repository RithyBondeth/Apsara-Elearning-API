import { integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { id } from '../../common/id.schema';
import { timestamps } from '../../common/timestap.schema';
import { modules } from '../module.schema';

export const lessons = pgTable('lessons', {
  ...id,
  moduleId: uuid('module_id')
    .references(() => modules.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  description: text('description'),
  slug: text('slug').notNull(),
  content: text('content'),
  order: integer('order').notNull().default(0),
  estimatedMinutes: integer('estimated_minutes'),
  ...timestamps,
});
