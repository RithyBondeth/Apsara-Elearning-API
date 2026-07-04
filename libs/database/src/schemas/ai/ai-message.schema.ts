import { integer, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { aiConversations } from './ai-conversation.schema';

export const aiMessages = pgTable('ai_messages', {
  ...id,
  conversationId: uuid('conversation_id')
    .references(() => aiConversations.id, { onDelete: 'cascade' })
    .notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  content: text('content'),
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  provider: varchar('provider', { length: 50 }),
  model: varchar('model', { length: 100 }),
  ...timestamps,
});
