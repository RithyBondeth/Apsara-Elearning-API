import { pgTable, text } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';

export const subjects = pgTable('subjects', {
  ...id,
  name: text('name').notNull(),
  nameKm: text('name_km'),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  descriptionKm: text('description_km'),
  icon: text('icon'),
  ...timestamps,
});
