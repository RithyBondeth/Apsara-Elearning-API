import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';

export const user = pgTable('users', {
  ...id,
  // User Info
  firstName: text('first_name'),
  lastName: text('last_name'),
  gender: text('gender'),
  dateOfBirth: date('date_of_birth'),
  avatar: text('avatar'),
  streak: integer('streak').default(0),
  xp: integer('xp').default(0),
  isAdmin: boolean('is_admin').notNull().default(false),

  // Email Password
  email: text('email').notNull().unique(),
  password: text('password').notNull(),

  // Reset Password
  resetPasswordToken: text('reset_password_token'),
  resetPasswordTokenExpiresAt: timestamp('reset_password_token_expires_at', {
    withTimezone: true,
    mode: 'date',
  }),

  // Phone OTP
  phone: text('phone'),
  otpCode: text('otp_code'),
  otpCodeExpiresAt: timestamp('otp_code_expires_at', {
    withTimezone: true,
    mode: 'date',
  }),

  // Email Verification
  isEmailVerified: boolean('is_email_verified').default(false),
  emailVerificationToken: text('email_verification_token'),
  emailVerificationTokenExpiresAt: timestamp(
    'email_verification_token_expires_at',
    {
      withTimezone: true,
      mode: 'date',
    },
  ),

  // Refresh Token
  refreshToken: text('refresh_token'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
    withTimezone: true,
    mode: 'date',
  }),

  // Social Login
  googleId: text('google_id').unique(),
  githubId: text('github_id').unique(),
  facebookId: text('facebook_id').unique(),

  // Last Login
  lastLoginAt: timestamp('last_login_at', {
    withTimezone: true,
    mode: 'date',
  }),
  lastLoginMethod: text('last_login_method'),

  ...timestamps,
});
