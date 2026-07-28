import { numeric, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { payments } from './payment.schema';

export const paymentRefunds = pgTable('payment_refunds', {
  ...id,
  paymentId: uuid('payment_id')
    .references(() => payments.id, { onDelete: 'cascade' })
    .notNull(),
  providerRefundId: varchar('provider_refund_id', { length: 255 })
    .notNull()
    .unique(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  status: varchar('status', { length: 32 }).notNull(),
  reason: varchar('reason', { length: 64 }),
  failureReason: text('failure_reason'),
  ...timestamps,
});
