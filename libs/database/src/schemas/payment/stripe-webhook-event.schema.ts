import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

/** Successfully processed Stripe events. The event ID makes retries idempotent. */
export const stripeWebhookEvents = pgTable('stripe_webhook_events', {
  eventId: varchar('event_id', { length: 255 }).primaryKey(),
  eventType: varchar('event_type', { length: 255 }).notNull(),
  livemode: boolean('livemode').notNull(),
  status: varchar('status', { length: 32 }).notNull().default('processing'),
  attempts: integer('attempts').notNull().default(1),
  lastError: text('last_error'),
  receivedAt: timestamp('received_at', {
    withTimezone: true,
    mode: 'date',
  })
    .notNull()
    .defaultNow(),
  processedAt: timestamp('processed_at', {
    withTimezone: true,
    mode: 'date',
  }),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  })
    .notNull()
    .defaultNow(),
});
