import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { user } from './user.schema';
import { badges } from './badge.schema';

export const userBadges = pgTable('user_badges', {
  ...id,
  userId: uuid('user_id').references(() => user.id),
  badgeId: uuid('badge_id').references(() => badges.id),
  earnedAt: timestamp('earned_at'),
  ...timestamps,
});
