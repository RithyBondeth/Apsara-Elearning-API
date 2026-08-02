import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  uuid,
} from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { subjects } from './subject.schema';
import { gradeLevels } from './grade-level.schema';
import { majors } from './major.schema';
import { programmingCategories } from './programming-category.schema';

export const difficultyEnum = pgEnum('difficulty_level', [
  'beginner',
  'intermediate',
  'advanced',
]);

export const programTypeEnum = pgEnum('program_type', [
  'k12',
  'university',
  'programming',
]);

export const courses = pgTable('courses', {
  ...id,
  programType: programTypeEnum('program_type').notNull().default('k12'),
  // K–12 placement
  subjectId: uuid('subject_id').references(() => subjects.id, {
    onDelete: 'set null',
  }),
  gradeLevelId: uuid('grade_level_id').references(() => gradeLevels.id, {
    onDelete: 'set null',
  }),
  // University placement
  majorId: uuid('major_id').references(() => majors.id, {
    onDelete: 'set null',
  }),
  // Programming placement
  categoryId: uuid('category_id').references(() => programmingCategories.id, {
    onDelete: 'set null',
  }),
  title: text('title').notNull(),
  titleKm: text('title_km'),
  description: text('description'),
  descriptionKm: text('description_km'),
  slug: text('slug').notNull().unique(),
  thumbnail: text('thumbnail'),
  difficulty: difficultyEnum('difficulty').notNull().default('beginner'),
  estimatedHours: integer('estimated_hours'),
  published: boolean('published').default(false),
  requiresSubscription: boolean('requires_subscription')
    .notNull()
    .default(false),
  requiredEntitlement: text('required_entitlement'),
  ...timestamps,
});
