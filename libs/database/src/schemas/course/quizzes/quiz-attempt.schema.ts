import { integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { id } from '../../common/id.schema';
import { timestamps } from '../../common/timestap.schema';
import { quizzes } from './quiz.schema';
import { user } from '../../user/user.schema';

export const quizAttempts = pgTable('quiz_attempts', {
  ...id,
  quizId: uuid('quiz_id')
    .references(() => quizzes.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  score: integer('score'),
  totalQuestions: integer('total_questions'),
  correctAnswers: integer('correct_answers'),
  completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
  ...timestamps,
});
