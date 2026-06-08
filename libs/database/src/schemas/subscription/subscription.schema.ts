import { boolean, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { user } from '../user/user.schema';
import { plans } from './plan.schema';

export const subscriptions = pgTable('subscriptions', {
  ...id,
  userId: uuid('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  planId: uuid('plan_id')
    .references(() => plans.id, { onDelete: 'restrict' })
    .notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true, mode: 'date' }),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
  active: boolean('active').default(true),
  ...timestamps,
});
