import { integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { id } from '../../common/id.schema';
import { timestamps } from '../../common/timestap.schema';
import { quizzes } from './quiz.schema';

export const quizQuestions = pgTable('quiz_questions', {
  ...id,
  quizId: uuid('quiz_id').references(() => quizzes.id),
  question: text('question').notNull(),
  explanation: text('explanation'),
  ...timestamps,
});
