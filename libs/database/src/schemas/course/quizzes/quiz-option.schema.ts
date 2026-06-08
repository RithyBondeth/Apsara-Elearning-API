import { boolean, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { id } from '../../common/id.schema';
import { timestamps } from '../../common/timestap.schema';
import { quizQuestions } from './quiz-question.schema';

export const quizOptions = pgTable('quiz_options', {
  ...id,
  questionId: uuid('question_id').references(() => quizQuestions.id),
  answer: text('answer').notNull(),
  isCorrect: boolean('is_correct').default(false),
  ...timestamps,
});
