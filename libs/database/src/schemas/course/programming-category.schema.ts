import { pgTable, text } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';

/**
 * Placement taxonomy for the `programming` track — Web Development,
 * Mobile App Development, Data Science & AI, and so on.
 *
 * Deliberately flat, mirroring `subjects` (K–12) rather than the
 * two-level `faculties → majors` shape used by university courses.
 */
export const programmingCategories = pgTable('programming_categories', {
  ...id,
  name: text('name').notNull(),
  nameKm: text('name_km'),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  descriptionKm: text('description_km'),
  icon: text('icon'),
  ...timestamps,
});
