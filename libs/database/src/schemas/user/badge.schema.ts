import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';

export const badges = pgTable('badges', {
  ...id,
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  xpRequired: integer('xp_required'),
  ...timestamps,
});
