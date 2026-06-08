import {
  boolean,
  integer,
  pgTable,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { codingChallenges } from './coding-challenge.schema';
import { user } from '../user/user.schema';

export const challengeSubmissions = pgTable('challenge_submissions', {
  ...id,
  challengeId: uuid('challenge_id').references(() => codingChallenges.id),
  userId: uuid('user_id').references(() => user.id),
  sourceCode: text('source_code'),
  language: varchar('language', { length: 50 }),
  score: integer('score'),
  passed: boolean('passed'),
  ...timestamps,
});
