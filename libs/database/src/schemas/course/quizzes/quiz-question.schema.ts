import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uuid,
} from 'drizzle-orm/pg-core';
import { id } from '../../common/id.schema';
import { timestamps } from '../../common/timestap.schema';
import { quizzes } from './quiz.schema';

export const questionTypeEnum = pgEnum('question_type', [
  'multiple_choice',
  'true_false',
  'fill_blank',
  'short_answer',
  'matching',
  'numeric',
]);

export const quizQuestions = pgTable('quiz_questions', {
  ...id,
  quizId: uuid('quiz_id')
    .references(() => quizzes.id, { onDelete: 'cascade' })
    .notNull(),
  type: questionTypeEnum('type').notNull().default('multiple_choice'),
  question: text('question').notNull(),
  // Type-specific answer spec for non-option questions, e.g.
  //   numeric:    { value: number, tolerance?: number }
  //   fill_blank: { accepted: string[], caseSensitive?: boolean }
  //   short_answer: { accepted: string[], caseSensitive?: boolean } | null (manual)
  //   matching:   { pairs: { left: string, right: string }[] }
  //   true_false: { value: boolean }
  // For choice questions (multiple_choice) correctness stays on quiz_options.
  correctAnswer: jsonb('correct_answer'),
  explanation: text('explanation'),
  points: integer('points').notNull().default(1),
  order: integer('order').notNull().default(0),
  ...timestamps,
});
