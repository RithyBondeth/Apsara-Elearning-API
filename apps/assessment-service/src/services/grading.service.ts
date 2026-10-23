import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, asc, desc, eq, isNotNull, isNull, sql, SQL } from 'drizzle-orm';
import { quizzes } from '@app/database/schemas/course/quizzes/quiz.schema';
import { quizQuestions } from '@app/database/schemas/course/quizzes/quiz-question.schema';
import { quizAttempts } from '@app/database/schemas/course/quizzes/quiz-attempt.schema';
import { quizAttemptAnswers } from '@app/database/schemas/course/quizzes/quiz-attempt-answer.schema';
import { lessons } from '@app/database/schemas/course/lessons/lesson.schema';
import { modules } from '@app/database/schemas/course/module.schema';
import { courses } from '@app/database/schemas/course/course.schema';
import { user } from '@app/database/schemas/user/user.schema';
import {
  DRIZZLE,
  GradeAnswerRequestDTO,
  GradeAnswerResponseDTO,
  GradingItemResponseDTO,
  GradingStatus,
  USER_SERVICE,
} from '@app/contracts';
import {
  notifyUser,
  RpcBadRequestException,
  RpcNotFoundException,
} from '@app/common';
import {
  PASS_THRESHOLD,
  grantXp,
  hasPassedBefore,
  lockLearnerQuiz,
} from './quiz-outcome';

const DEFAULT_LIMIT = 50;

/**
 * Manual grading of answers the auto-grader can't score — short answers
 * authored without an accepted-answer list. Admins see a queue, give each
 * answer 0..max points with optional feedback, and the attempt is rescored:
 * crossing the pass mark can unlock first-pass XP, and the learner is told
 * once nothing on the attempt is left to grade.
 */
@Injectable()
export class GradingService {
  private readonly logger = new Logger(GradingService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    @Inject(USER_SERVICE.NAME) private readonly userClient: ClientProxy,
  ) {}

  /** Pending: oldest first, so nobody waits longest. Graded: newest first. */
  async list(
    status: GradingStatus = 'pending',
    limit = DEFAULT_LIMIT,
  ): Promise<GradingItemResponseDTO[]> {
    const pending = status === 'pending';
    return this.query(
      and(
        eq(quizAttemptAnswers.requiresReview, true),
        pending
          ? isNull(quizAttemptAnswers.reviewedAt)
          : isNotNull(quizAttemptAnswers.reviewedAt),
      )!,
      pending
        ? asc(quizAttemptAnswers.createdAt)
        : desc(quizAttemptAnswers.reviewedAt),
      limit,
    );
  }

  async grade(
    adminId: string,
    answerId: string,
    { points, feedback }: GradeAnswerRequestDTO,
  ): Promise<GradeAnswerResponseDTO> {
    const [found] = await this.db
      .select({
        attemptId: quizAttemptAnswers.attemptId,
        requiresReview: quizAttemptAnswers.requiresReview,
        userId: quizAttempts.userId,
        quizId: quizAttempts.quizId,
        maxPoints: quizQuestions.points,
      })
      .from(quizAttemptAnswers)
      .innerJoin(
        quizAttempts,
        eq(quizAttemptAnswers.attemptId, quizAttempts.id),
      )
      .innerJoin(
        quizQuestions,
        eq(quizAttemptAnswers.questionId, quizQuestions.id),
      )
      .where(eq(quizAttemptAnswers.id, answerId))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Answer not found');
    if (!found.requiresReview) {
      throw new RpcBadRequestException(
        'This answer was graded automatically and cannot be graded by hand',
      );
    }
    const maxPoints = found.maxPoints ?? 1;
    if (points > maxPoints) {
      throw new RpcBadRequestException(
        `Points must be between 0 and ${maxPoints}`,
      );
    }

    const outcome = await this.db.transaction(async (tx) => {
      // Same lock as submit: grading and submits of this learner's quiz
      // can't interleave, so the first-pass check below sees everything.
      await lockLearnerQuiz(tx, found.userId, found.quizId);

      const now = new Date();
      await tx
        .update(quizAttemptAnswers)
        .set({
          pointsAwarded: points,
          isCorrect: points === maxPoints,
          reviewedAt: now,
          reviewedBy: adminId,
          reviewFeedback: feedback?.trim() || null,
          updatedAt: now,
        })
        .where(eq(quizAttemptAnswers.id, answerId));

      // Rescore from the stored answers; unanswered questions still count
      // towards the total, exactly as at submit.
      const answers = await tx
        .select({
          pointsAwarded: quizAttemptAnswers.pointsAwarded,
          isCorrect: quizAttemptAnswers.isCorrect,
          requiresReview: quizAttemptAnswers.requiresReview,
          reviewedAt: quizAttemptAnswers.reviewedAt,
        })
        .from(quizAttemptAnswers)
        .where(eq(quizAttemptAnswers.attemptId, found.attemptId));
      const [{ total }] = await tx
        .select({
          total: sql<number>`coalesce(sum(${quizQuestions.points}), 0)::int`,
        })
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, found.quizId));
      const earned = answers.reduce(
        (sum, a) => sum + (a.pointsAwarded ?? 0),
        0,
      );
      const score = total > 0 ? Math.round((earned / total) * 100) : 0;
      const passed = score >= PASS_THRESHOLD;
      const stillPending = answers.filter(
        (a) => a.requiresReview && !a.reviewedAt,
      ).length;

      const [attempt] = await tx
        .select({ passRewarded: quizAttempts.passRewarded })
        .from(quizAttempts)
        .where(eq(quizAttempts.id, found.attemptId))
        .limit(1);
      // First-pass XP only if this attempt's pass was never considered and
      // no other attempt of the quiz has passed.
      const rewardPass =
        passed &&
        !attempt.passRewarded &&
        !(await hasPassedBefore(
          tx,
          found.userId,
          found.quizId,
          found.attemptId,
        ));

      await tx
        .update(quizAttempts)
        .set({
          score,
          correctAnswers: answers.filter((a) => a.isCorrect).length,
          passRewarded: attempt.passRewarded || passed,
          updatedAt: now,
        })
        .where(eq(quizAttempts.id, found.attemptId));

      return { score, passed, stillPending, rewardPass };
    });

    const [quiz] = await this.db
      .select({
        title: quizzes.title,
        lessonId: quizzes.lessonId,
        xpReward: quizzes.xpReward,
      })
      .from(quizzes)
      .where(eq(quizzes.id, found.quizId))
      .limit(1);

    const xpAwarded = outcome.rewardPass
      ? await grantXp(
          this.userClient,
          this.logger,
          found.userId,
          quiz?.xpReward ?? 0,
        )
      : 0;

    if (outcome.stillPending === 0) {
      await notifyUser(
        this.userClient,
        {
          userId: found.userId,
          type: 'quiz_graded',
          title: `Quiz graded: ${quiz?.title ?? 'Quiz'}`,
          body: `Your score is ${outcome.score}%.`,
          data: {
            quizId: found.quizId,
            attemptId: found.attemptId,
            lessonId: quiz?.lessonId,
            score: outcome.score,
          },
        },
        this.logger,
      );
    }

    const [item] = await this.query(
      eq(quizAttemptAnswers.id, answerId),
      asc(quizAttemptAnswers.createdAt),
      1,
    );
    this.logger.log(
      `Admin ${adminId} graded answer ${answerId}: ${points}/${maxPoints} (attempt now ${outcome.score}%)`,
    );
    return new GradeAnswerResponseDTO({
      item,
      attemptScore: outcome.score,
      attemptPassed: outcome.passed,
      stillPending: outcome.stillPending,
      xpAwarded,
    });
  }

  /** Grading rows with everything a grader needs to judge the answer. */
  private async query(
    where: SQL,
    orderBy: SQL,
    limit: number,
  ): Promise<GradingItemResponseDTO[]> {
    const rows = await this.db
      .select({
        answerId: quizAttemptAnswers.id,
        attemptId: quizAttemptAnswers.attemptId,
        answerData: quizAttemptAnswers.answerData,
        pointsAwarded: quizAttemptAnswers.pointsAwarded,
        reviewedAt: quizAttemptAnswers.reviewedAt,
        feedback: quizAttemptAnswers.reviewFeedback,
        submittedAt: quizAttemptAnswers.createdAt,
        question: quizQuestions.question,
        explanation: quizQuestions.explanation,
        maxPoints: quizQuestions.points,
        quizTitle: quizzes.title,
        lessonTitle: lessons.title,
        courseTitle: courses.title,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      })
      .from(quizAttemptAnswers)
      .innerJoin(
        quizAttempts,
        eq(quizAttemptAnswers.attemptId, quizAttempts.id),
      )
      .innerJoin(
        quizQuestions,
        eq(quizAttemptAnswers.questionId, quizQuestions.id),
      )
      .leftJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
      .leftJoin(lessons, eq(quizzes.lessonId, lessons.id))
      .leftJoin(modules, eq(lessons.moduleId, modules.id))
      .leftJoin(courses, eq(modules.courseId, courses.id))
      .leftJoin(user, eq(quizAttempts.userId, user.id))
      .where(where)
      .orderBy(orderBy)
      .limit(limit);

    return rows.map((row) => {
      const text = (row.answerData as { text?: unknown } | null)?.text;
      const name = [row.firstName, row.lastName].filter(Boolean).join(' ');
      return new GradingItemResponseDTO({
        answerId: row.answerId,
        attemptId: row.attemptId,
        submittedAt: row.submittedAt,
        learnerName: name || null,
        learnerEmail: row.email ?? null,
        courseTitle: row.courseTitle ?? null,
        lessonTitle: row.lessonTitle ?? null,
        quizTitle: row.quizTitle ?? null,
        question: row.question,
        explanation: row.explanation ?? null,
        maxPoints: row.maxPoints ?? 1,
        answerText: typeof text === 'string' ? text : null,
        status: row.reviewedAt ? 'graded' : 'pending',
        pointsAwarded: row.pointsAwarded ?? 0,
        feedback: row.feedback ?? null,
        reviewedAt: row.reviewedAt ?? null,
      });
    });
  }
}
