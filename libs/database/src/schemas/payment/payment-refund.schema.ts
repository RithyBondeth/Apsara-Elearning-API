import { numeric, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { payments } from './payment.schema';
import { user } from '../user/user.schema';

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
  // Set for refunds issued from the admin console (null for ones made in the
  // Stripe dashboard): who asked, and their note for the audit trail.
  requestedBy: uuid('requested_by').references(() => user.id, {
    onDelete: 'set null',
  }),
  note: text('note'),
  ...timestamps,
});
