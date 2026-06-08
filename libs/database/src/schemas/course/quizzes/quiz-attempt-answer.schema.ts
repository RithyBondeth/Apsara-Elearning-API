import { boolean, pgTable, uuid } from 'drizzle-orm/pg-core';
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
  selectedOptionId: uuid('selected_option_id')
    .references(() => quizOptions.id, { onDelete: 'set null' }),
  isCorrect: boolean('is_correct').notNull().default(false),
  ...timestamps,
});
