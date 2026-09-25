import { boolean, date, pgTable, text } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';

/**
 * A quote from a real teacher, beta tester or partner — entered by an admin,
 * never by the person themselves.
 *
 * Consent is part of the row, not a checkbox that disappears: `consentSource`
 * says how permission was given ("Signed form, Grade 12 pilot") and
 * `consentedAt` when. Both are required, so a quote cannot be published
 * without a record that the person agreed to it.
 */
export const testimonials = pgTable('testimonials', {
  ...id,
  name: text('name').notNull(),
  role: text('role').notNull(),
  roleKm: text('role_km'),
  quote: text('quote').notNull(),
  quoteKm: text('quote_km'),
  avatar: text('avatar'),
  consentSource: text('consent_source').notNull(),
  consentedAt: date('consented_at', { mode: 'string' }).notNull(),
  published: boolean('published').notNull().default(false),
  ...timestamps,
});
