import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { faculties } from './faculty.schema';

export const majors = pgTable('majors', {
  ...id,
  facultyId: uuid('faculty_id').references(() => faculties.id, {
    onDelete: 'set null',
  }),
  name: text('name').notNull(),
  nameKm: text('name_km'),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  ...timestamps,
});
