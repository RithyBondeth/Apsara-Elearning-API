import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { id } from '../../common/id.schema';
import { timestamps } from '../../common/timestap.schema';
import { quizAttempts } from './quiz-attempt.schema';
import { quizQuestions } from './quiz-question.schema';
import { quizOptions } from './quiz-option.schema';
import { user } from '../../user/user.schema';

export const quizAttemptAnswers = pgTable(
  'quiz_attempt_answers',
  {
    ...id,
    attemptId: uuid('attempt_id')
      .references(() => quizAttempts.id, { onDelete: 'cascade' })
      .notNull(),
    questionId: uuid('question_id')
      .references(() => quizQuestions.id, { onDelete: 'cascade' })
      .notNull(),
    // Choice-based questions record the picked option; other types record their
    // raw answer in answerData, e.g. { text: string } | { value: number } |
    // { pairs: { left, right }[] }.
    selectedOptionId: uuid('selected_option_id').references(
      () => quizOptions.id,
      {
        onDelete: 'set null',
      },
    ),
    answerData: jsonb('answer_data'),
    isCorrect: boolean('is_correct').notNull().default(false),
    pointsAwarded: integer('points_awarded').notNull().default(0),
    // Set when a question cannot be auto-graded (e.g. a short_answer with no
    // accepted-answer spec) and a human still needs to score it.
    requiresReview: boolean('requires_review').notNull().default(false),
    // Manual grading of a requiresReview answer. Pending = requiresReview and
    // reviewedAt is null. An admin may regrade; the latest grade wins.
    reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'date' }),
    reviewedBy: uuid('reviewed_by').references(() => user.id, {
      onDelete: 'set null',
    }),
    reviewFeedback: text('review_feedback'),
    ...timestamps,
  },
  // Matches migrations/20261024_add_manual_grading.sql: the grading queue
  // reads answers still waiting for a human.
  (t) => [
    index('quiz_attempt_answers_pending_review_idx')
      .on(t.createdAt)
      .where(sql`${t.requiresReview} AND ${t.reviewedAt} IS NULL`),
  ],
);
