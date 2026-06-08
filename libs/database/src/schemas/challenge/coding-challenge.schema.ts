import { integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { lessons } from '../course/lessons/lesson.schema';

export const codingChallenges = pgTable('coding_challenges', {
  ...id,
  lessonId: uuid('lesson_id')
    .references(() => lessons.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  description: text('description'),
  starterCode: text('starter_code'),
  solutionCode: text('solution_code'),
  xpReward: integer('xp_reward').default(50),
  ...timestamps,
});
