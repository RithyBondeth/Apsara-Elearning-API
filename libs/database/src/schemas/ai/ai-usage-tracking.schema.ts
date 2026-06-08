import { integer, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { user } from '../user/user.schema';

export const aiUsageTracking = pgTable('ai_usage_tracking', {
  ...id,
  userId: uuid('user_id')
    .references(() => user.id)
    .notNull(),
  feature: varchar('feature'),
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  totalTokens: integer('total_tokens'),
  ...timestamps,
});
