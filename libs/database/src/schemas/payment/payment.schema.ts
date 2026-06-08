import { numeric, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { user } from '../user/user.schema';

export const payments = pgTable('payments', {
  ...id,
  userId: uuid('user_id')
    .references(() => user.id)
    .notNull(),
  amount: numeric('amount', {
    precision: 10,
    scale: 2,
  }),
  currency: varchar('currency'),
  provider: varchar('provider'),
  transactionId: varchar('transaction_id'),
  status: varchar('status'),
  ...timestamps,
});
