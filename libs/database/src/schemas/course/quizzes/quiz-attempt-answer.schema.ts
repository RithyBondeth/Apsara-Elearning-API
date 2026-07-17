import { boolean, integer, jsonb, pgTable, uuid } from 'drizzle-orm/pg-core';
import { id } from '../../common/id.schema';
import { timestamps } from '../../common/timestap.schema';
import { quizAttempts } from './quiz-attempt.schema';
import { quizQuestions } from './quiz-question.schema';
import { quizOptions } from './quiz-option.schema';

export const quizAttemptAnswers = pgTable('quiz_attempt_answers', {
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
  ...timestamps,
});
