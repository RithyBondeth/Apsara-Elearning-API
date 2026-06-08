import { integer, numeric, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';

export const billingPeriodEnum = pgEnum('billing_period', [
  'monthly',
  'yearly',
  'lifetime',
]);

export const plans = pgTable('plans', {
  ...id,
  name: text('name').notNull(),
  description: text('description'),
  slug: text('slug').notNull().unique(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  billingPeriod: billingPeriodEnum('billing_period').notNull().default('monthly'),
  aiCredits: integer('ai_credits').notNull().default(0),
  ...timestamps,
});
