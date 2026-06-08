import { integer, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { id } from '../../common/id.schema';
import { timestamps } from '../../common/timestap.schema';
import { modules } from '../module.schema';

export const lessonTypeEnum = pgEnum('lesson_type', [
  'article',
  'video',
  'interactive',
]);

export const lessons = pgTable('lessons', {
  ...id,
  moduleId: uuid('module_id')
    .references(() => modules.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  description: text('description'),
  slug: text('slug').notNull(),
  type: lessonTypeEnum('type').notNull().default('article'),
  content: text('content'),
  videoUrl: text('video_url'),
  order: integer('order').notNull().default(0),
  estimatedMinutes: integer('estimated_minutes'),
  ...timestamps,
});
