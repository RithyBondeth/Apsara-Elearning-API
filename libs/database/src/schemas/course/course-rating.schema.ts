import {
  check,
  index,
  integer,
  pgTable,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { id } from '../common/id.schema';
import { timestamps } from '../common/timestap.schema';
import { user } from '../user/user.schema';
import { courses } from './course.schema';

/**
 * A learner's rating of a course, with an optional written review.
 *
 * One row per learner per course — rating again updates the existing row
 * rather than stacking, so an average cannot be inflated by one enthusiastic
 * account.
 *
 * `rating` is 1–5, enforced by a check constraint as well as the request DTO:
 * the RPC action is callable by any service, and an out-of-range value would
 * silently skew every average for that course.
 */
export const courseRatings = pgTable(
  'course_ratings',
  {
    ...id,
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    courseId: uuid('course_id')
      .references(() => courses.id, { onDelete: 'cascade' })
      .notNull(),
    rating: integer('rating').notNull(),
    review: text('review'),
    ...timestamps,
  },
  // Named explicitly so the hand-written migration and a later `db:push` agree.
  (t) => [
    unique().on(t.userId, t.courseId),
    check('course_ratings_rating_range', sql`${t.rating} >= 1 and ${t.rating} <= 5`),
    index('course_ratings_course_id_index').on(t.courseId),
  ],
);
