import { pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../common/timestap.schema';
import { user } from './user.schema';
import { badges } from './badge.schema';

export const userBadges = pgTable(
  'user_badges',
  {
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    badgeId: uuid('badge_id')
      .references(() => badges.id, { onDelete: 'cascade' })
      .notNull(),
    earnedAt: timestamp('earned_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.userId, t.badgeId] })],
);
