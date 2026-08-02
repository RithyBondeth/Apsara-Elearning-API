import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { user } from '../user/user.schema';

export const userEntitlementGrants = pgTable('user_entitlement_grants', {
  ...id,
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  entitlement: varchar('entitlement', { length: 64 }).notNull(),
  effect: varchar('effect', { length: 16 }).notNull().default('allow'),
  startsAt: timestamp('starts_at', { withTimezone: true, mode: 'date' }),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
  reason: text('reason').notNull(),
  grantedBy: uuid('granted_by').references(() => user.id, {
    onDelete: 'set null',
  }),
  revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' }),
  ...timestamps,
});
