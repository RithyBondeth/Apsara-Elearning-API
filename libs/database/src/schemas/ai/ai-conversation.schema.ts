import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { user } from '../user/user.schema';

export const aiConversations = pgTable('ai_conversations', {
  ...id,
  userId: uuid('user_id')
    .references(() => user.id)
    .notNull(),
  title: text('title').notNull(),
  ...timestamps,
});
