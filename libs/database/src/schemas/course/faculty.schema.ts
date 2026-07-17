import { pgTable, text } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';

export const faculties = pgTable('faculties', {
  ...id,
  name: text('name').notNull(),
  nameKm: text('name_km'),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  icon: text('icon'),
  ...timestamps,
});
