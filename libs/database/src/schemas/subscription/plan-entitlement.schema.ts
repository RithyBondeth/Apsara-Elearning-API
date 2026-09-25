import { index, primaryKey, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { plans } from './plan.schema';

export const planEntitlements = pgTable(
  'plan_entitlements',
  {
    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id, { onDelete: 'cascade' }),
    entitlement: varchar('entitlement', { length: 64 }).notNull(),
  },
  // Index name and columns match migrations/20260728_add_named_entitlements.sql,
  // so a database built with `db:push` gets the same index as a migrated one.
  (table) => [
    primaryKey({ columns: [table.planId, table.entitlement] }),
    index('idx_plan_entitlements_entitlement').on(
      table.entitlement,
      table.planId,
    ),
  ],
);
