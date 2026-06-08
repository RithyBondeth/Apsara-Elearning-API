import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as userSchema from './schemas/user/user.schema';
import * as userBadgeSchema from './schemas/user/user-badge.schema';
import * as badgeSchema from './schemas/user/badge.schema';
import * as categorySchema from './schemas/course/category.schema';
import * as courseSchema from './schemas/course/course.schema';
import * as enrollmentSchema from './schemas/course/enrollment.schema';
import * as moduleSchema from './schemas/course/module.schema';
import * as lessonSchema from './schemas/course/lessons/lesson.schema';
import * as lessonProgressSchema from './schemas/course/lessons/lesson-progress.schema';
import * as quizSchema from './schemas/course/quizzes/quiz.schema';
import * as quizQuestionSchema from './schemas/course/quizzes/quiz-question.schema';
import * as quizOptionSchema from './schemas/course/quizzes/quiz-option.schema';
import * as quizAttemptSchema from './schemas/course/quizzes/quiz-attempt.schema';
import * as quizAttemptAnswerSchema from './schemas/course/quizzes/quiz-attempt-answer.schema';
import * as challengeSchema from './schemas/challenge/coding-challenge.schema';
import * as challengeTestCaseSchema from './schemas/challenge/challenge-test-case.schema';
import * as challengeSubmissionSchema from './schemas/challenge/challenge-submission.schema';
import * as aiConversationSchema from './schemas/ai/ai-conversation.schema';
import * as aiMessageSchema from './schemas/ai/ai-message.schema';
import * as aiUsageTrackingSchema from './schemas/ai/ai-usage-tracking.schema';
import * as planSchema from './schemas/subscription/plan.schema';
import * as subscriptionSchema from './schemas/subscription/subscription.schema';
import * as paymentSchema from './schemas/payment/payment.schema';

const schema = {
  ...userSchema,
  ...userBadgeSchema,
  ...badgeSchema,
  ...categorySchema,
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
  ...paymentSchema,
};

@Module({
  providers: [
    {
      provide: 'DRIZZLE',
      useFactory: (configService: ConfigService) => {
        const sql = neon(configService.get<string>('database.url')!);
        return drizzle(sql, { schema });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['DRIZZLE'],
})
export class DatabaseModule {}
