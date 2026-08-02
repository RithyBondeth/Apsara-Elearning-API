import { integer, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';

export const educationStageEnum = pgEnum('education_stage', [
  'primary', // Grades 1–6
  'lower_secondary', // Grades 7–9
  'upper_secondary', // Grades 10–12
]);

export const gradeLevels = pgTable('grade_levels', {
  ...id,
  stage: educationStageEnum('stage').notNull(),
  grade: integer('grade').notNull().unique(), // 1–12
  name: text('name').notNull(), // e.g. "Grade 7"
  nameKm: text('name_km'),
  order: integer('order').notNull().default(0),
  ...timestamps,
});
