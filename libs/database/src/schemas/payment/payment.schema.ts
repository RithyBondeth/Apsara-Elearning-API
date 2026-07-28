import { numeric, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { user } from '../user/user.schema';
import { subscriptions } from '../subscription/subscription.schema';

export const payments = pgTable('payments', {
  ...id,
  userId: uuid('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id, {
    onDelete: 'set null',
  }),
  amount: numeric('amount', { precision: 10, scale: 2 }),
  currency: varchar('currency'),
  provider: varchar('provider'),
  transactionId: varchar('transaction_id').unique(),
  providerInvoiceId: varchar('provider_invoice_id', { length: 255 }).unique(),
  providerPaymentIntentId: varchar('provider_payment_intent_id', {
    length: 255,
  }).unique(),
  providerChargeId: varchar('provider_charge_id', { length: 255 }).unique(),
  status: varchar('status'),
  refundedAmount: numeric('refunded_amount', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),
  refundStatus: varchar('refund_status', { length: 32 }),
  ...timestamps,
});
