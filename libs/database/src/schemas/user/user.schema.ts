import { boolean, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';

export const user = pgTable('users', {
  ...id,
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  dateOfBirth: text('date_of_birth'),
  phone: text('phone'),
  avatar: text('avatar'),
  streak: integer('streak').default(0),
  xp: integer('xp').default(0),
  isVerified: boolean('is_verified').default(false),
  ...timestamps,
});
