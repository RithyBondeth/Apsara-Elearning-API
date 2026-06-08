import { boolean, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { codingChallenges } from './coding-challenge.schema';

export const challengeTestCases = pgTable('challenge_test_cases', {
  ...id,
  challengeId: uuid('challenge_id')
    .references(() => codingChallenges.id, { onDelete: 'cascade' })
    .notNull(),
  input: text('input'),
  expectedOutput: text('expected_output').notNull(),
  isHidden: boolean('is_hidden').default(false),
  order: integer('order').notNull().default(0),
  ...timestamps,
});
