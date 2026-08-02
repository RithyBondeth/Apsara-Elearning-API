import { primaryKey, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { plans } from './plan.schema';

export const planEntitlements = pgTable(
  'plan_entitlements',
  {
    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id, { onDelete: 'cascade' }),
    entitlement: varchar('entitlement', { length: 64 }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.planId, table.entitlement] })],
);
