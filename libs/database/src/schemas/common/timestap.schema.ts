import { timestamp } from 'drizzle-orm/pg-core';

export const timestamps = {
  createAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  })
    .notNull()
    .defaultNow(),
  updateAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  })
    .notNull()
    .defaultNow(),
};
