import { boolean, integer, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { codingChallenges } from './coding-challenge.schema';
import { user } from '../user/user.schema';

export const challengeSubmissions = pgTable('challenge_submissions', {
  ...id,
  challengeId: uuid('challenge_id')
    .references(() => codingChallenges.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  sourceCode: text('source_code'),
  language: varchar('language', { length: 50 }),
  passed: boolean('passed').default(false),
  score: integer('score'),
  testCasesPassed: integer('test_cases_passed'),
  testCasesTotal: integer('test_cases_total'),
  executionTimeMs: integer('execution_time_ms'),
  memoryUsedKb: integer('memory_used_kb'),
  errorMessage: text('error_message'),
  ...timestamps,
});
