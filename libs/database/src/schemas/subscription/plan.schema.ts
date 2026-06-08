import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { numeric } from 'drizzle-orm/pg-core';

export const plans = pgTable('plans', {
  ...id,
  name: text('name'),
  description: text('description'),
  slug: text('slug').unique(),
  price: numeric('price', {
    precision: 10,
    scale: 2,
  }),
  aiCredits: integer('ai_credits'),
  ...timestamps,
});
