import {
  boolean,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
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
  provider: varchar('provider', { length: 32 }).notNull().default('stripe'),
  status: varchar('status', { length: 32 }).notNull().default('incomplete'),
  providerCustomerId: varchar('provider_customer_id', { length: 255 }),
  providerSubscriptionId: varchar('provider_subscription_id', {
    length: 255,
  }).unique(),
  currentPeriodStart: timestamp('current_period_start', {
    withTimezone: true,
    mode: 'date',
  }),
  currentPeriodEnd: timestamp('current_period_end', {
    withTimezone: true,
    mode: 'date',
  }),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true, mode: 'date' }),
  graceEndsAt: timestamp('grace_ends_at', { withTimezone: true, mode: 'date' }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  ...timestamps,
});
