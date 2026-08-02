import { ConfigService } from '@nestjs/config';
import postgres from 'postgres';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as userSchema from '../schemas/user/user.schema';
import * as userBadgeSchema from '../schemas/user/user-badge.schema';
import * as badgeSchema from '../schemas/user/badge.schema';
import * as subjectSchema from '../schemas/course/subject.schema';
import * as gradeLevelSchema from '../schemas/course/grade-level.schema';
import * as facultySchema from '../schemas/course/faculty.schema';
import * as majorSchema from '../schemas/course/major.schema';
import * as programmingCategorySchema from '../schemas/course/programming-category.schema';
import * as courseSchema from '../schemas/course/course.schema';
import * as enrollmentSchema from '../schemas/course/enrollment.schema';
import * as moduleSchema from '../schemas/course/module.schema';
import * as lessonSchema from '../schemas/course/lessons/lesson.schema';
import * as lessonProgressSchema from '../schemas/course/lessons/lesson-progress.schema';
import * as quizSchema from '../schemas/course/quizzes/quiz.schema';
import * as quizQuestionSchema from '../schemas/course/quizzes/quiz-question.schema';
import * as quizOptionSchema from '../schemas/course/quizzes/quiz-option.schema';
import * as quizAttemptSchema from '../schemas/course/quizzes/quiz-attempt.schema';
import * as quizAttemptAnswerSchema from '../schemas/course/quizzes/quiz-attempt-answer.schema';
import * as challengeSchema from '../schemas/challenge/coding-challenge.schema';
import * as challengeTestCaseSchema from '../schemas/challenge/challenge-test-case.schema';
import * as challengeSubmissionSchema from '../schemas/challenge/challenge-submission.schema';
import * as aiConversationSchema from '../schemas/ai/ai-conversation.schema';
import * as aiMessageSchema from '../schemas/ai/ai-message.schema';
import * as aiUsageTrackingSchema from '../schemas/ai/ai-usage-tracking.schema';
import * as planSchema from '../schemas/subscription/plan.schema';
import * as subscriptionSchema from '../schemas/subscription/subscription.schema';
import * as planEntitlementSchema from '../schemas/subscription/plan-entitlement.schema';
import * as userEntitlementGrantSchema from '../schemas/subscription/user-entitlement-grant.schema';
import * as paymentSchema from '../schemas/payment/payment.schema';
import * as stripeWebhookEventSchema from '../schemas/payment/stripe-webhook-event.schema';
import * as paymentRefundSchema from '../schemas/payment/payment-refund.schema';

const schema = {
  ...userSchema,
  ...userBadgeSchema,
  ...badgeSchema,
  ...subjectSchema,
  ...gradeLevelSchema,
  ...facultySchema,
  ...majorSchema,
  ...programmingCategorySchema,
  ...courseSchema,
  ...enrollmentSchema,
  ...moduleSchema,
  ...lessonSchema,
  ...lessonProgressSchema,
  ...quizSchema,
  ...quizQuestionSchema,
  ...quizOptionSchema,
  ...quizAttemptSchema,
  ...quizAttemptAnswerSchema,
  ...challengeSchema,
  ...challengeTestCaseSchema,
  ...challengeSubmissionSchema,
  ...aiConversationSchema,
  ...aiMessageSchema,
  ...aiUsageTrackingSchema,
  ...planSchema,
  ...subscriptionSchema,
  ...planEntitlementSchema,
  ...userEntitlementGrantSchema,
  ...paymentSchema,
  ...stripeWebhookEventSchema,
  ...paymentRefundSchema,
};

export const databaseConfig = (
  configService: ConfigService,
): PostgresJsDatabase<typeof schema> => {
  const sql = postgres(configService.get<string>('database.url')!);
  return drizzle(sql, { logger: true, schema });
};
