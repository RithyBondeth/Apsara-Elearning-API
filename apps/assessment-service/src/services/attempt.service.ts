import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm';
import { quizzes } from '@app/database/schemas/course/quizzes/quiz.schema';
import { quizQuestions } from '@app/database/schemas/course/quizzes/quiz-question.schema';
import { quizOptions } from '@app/database/schemas/course/quizzes/quiz-option.schema';
import { quizAttempts } from '@app/database/schemas/course/quizzes/quiz-attempt.schema';
import { quizAttemptAnswers } from '@app/database/schemas/course/quizzes/quiz-attempt-answer.schema';
import { lessons } from '@app/database/schemas/course/lessons/lesson.schema';
import { modules } from '@app/database/schemas/course/module.schema';
import { courses } from '@app/database/schemas/course/course.schema';
import {
  AttemptAnswerDTO,
  AttemptAnswerResponseDTO,
  AttemptResponseDTO,
  AttemptReviewResponseDTO,
  DRIZZLE,
  IAttemptService,
  QuizResponseDTO,
  StartAttemptResponseDTO,
  SubmitAttemptResponseDTO,
  USER_SERVICE,
} from '@app/contracts';
import {
  CourseEntitlementService,
  notifyUser,
  RpcBadRequestException,
  RpcNotFoundException,
} from '@app/common';
import { gradeAnswer, GradableQuestion } from './graders';

const PASS_THRESHOLD = 70;

/** One graded answer, as recorded on submit and replayed in a review. */
interface GivenAnswer {
  selectedOptionId: string | null;
  answerData: Record<string, unknown> | null;
  isCorrect: boolean;
  requiresReview: boolean;
}

@Injectable()
export class AttemptService implements IAttemptService {
  private readonly logger = new Logger(AttemptService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    @Inject(USER_SERVICE.NAME) private readonly userClient: ClientProxy,
    private readonly entitlements: CourseEntitlementService,
  ) {}

  /** Creates an attempt and returns the quiz with all answer keys stripped. */
  async start(
    userId: string,
    quizId: string,
  ): Promise<StartAttemptResponseDTO> {
    const [quiz] = await this.db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1);
    if (!quiz) throw new RpcNotFoundException('Quiz not found');
    await this.entitlements.assertCanReadLesson({ id: quiz.lessonId }, userId);

    const questions = await this.db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(quizQuestions.order);

    if (questions.length === 0) {
      throw new RpcBadRequestException('Quiz has no questions yet');
    }

    const questionIds = questions.map((q) => q.id);
    const options = await this.db
      .select({
        id: quizOptions.id,
        questionId: quizOptions.questionId,
        answer: quizOptions.answer,
      })
      .from(quizOptions)
      .where(inArray(quizOptions.questionId, questionIds));

    const [attempt] = await this.db
      .insert(quizAttempts)
      .values({ quizId, userId, totalQuestions: questions.length })
      .returning();

    return new StartAttemptResponseDTO({
      attempt: new AttemptResponseDTO(attempt),
      quiz: new QuizResponseDTO(quiz),
      questions: questions.map((q) => ({
        id: q.id,
        type: q.type,
        question: q.question,
        points: q.points ?? 1,
        order: q.order ?? 0,
        // NOTE: options intentionally exclude `isCorrect`, and `correctAnswer`
        // is never returned — only the renderable prompt derived from it.
        options: options
          .filter((o) => o.questionId === q.id)
          .map((o) => ({ id: o.id, answer: o.answer })),
        prompt: this.buildPrompt(q),
      })),
    });
  }

  async submit(
    userId: string,
    attemptId: string,
    answers: AttemptAnswerDTO[],
  ): Promise<SubmitAttemptResponseDTO> {
    const [attempt] = await this.db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.id, attemptId))
      .limit(1);
    if (!attempt) throw new RpcNotFoundException('Attempt not found');
    if (attempt.userId !== userId) {
      throw new RpcBadRequestException('Attempt does not belong to this user');
    }
    if (attempt.completedAt) {
      throw new RpcBadRequestException('Attempt has already been submitted');
    }

    const [quiz] = await this.db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, attempt.quizId))
      .limit(1);
    if (!quiz) throw new RpcNotFoundException('Quiz not found');
    await this.entitlements.assertCanReadLesson({ id: quiz.lessonId }, userId);

    const { questions, optionsByQuestion, correctByQuestion } =
      await this.loadAnswerKey(attempt.quizId);
    const questionById = new Map<string, GradableQuestion>(
      questions.map((q) => [q.id, q]),
    );
    const questionIds = questions.map((q) => q.id);

    // Grade each submitted answer (one per question, first write wins).
    const seen = new Set<string>();
    const answerByQuestion = new Map<string, GivenAnswer>();
    let correct = 0;
    let earnedPoints = 0;
    let needsReview = 0;
    for (const ans of answers) {
      if (seen.has(ans.questionId)) continue;
      const question = questionById.get(ans.questionId);
      if (!question) {
        throw new RpcBadRequestException(
          `Question ${ans.questionId} does not belong to this quiz`,
        );
      }
      seen.add(ans.questionId);

      const result = gradeAnswer(question, ans, {
        correctOptionIds: correctByQuestion.get(ans.questionId) ?? new Set(),
      });
      if (result.isCorrect) correct++;
      if (result.requiresReview) needsReview++;
      earnedPoints += result.pointsAwarded;

      answerByQuestion.set(ans.questionId, {
        selectedOptionId: ans.selectedOptionId ?? null,
        answerData: ans.answerData ?? null,
        isCorrect: result.isCorrect,
        requiresReview: result.requiresReview,
      });

      await this.db.insert(quizAttemptAnswers).values({
        attemptId,
        questionId: ans.questionId,
        selectedOptionId: ans.selectedOptionId ?? null,
        answerData: ans.answerData ?? null,
        isCorrect: result.isCorrect,
        pointsAwarded: result.pointsAwarded,
        requiresReview: result.requiresReview,
      });
    }

    // Score is weighted by question points; unanswered questions still count.
    const totalPoints = questions.reduce((sum, q) => sum + (q.points ?? 1), 0);
    const total = attempt.totalQuestions ?? questionIds.length;
    const score =
      totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= PASS_THRESHOLD;

    const [updated] = await this.db
      .update(quizAttempts)
      .set({
        score,
        correctAnswers: correct,
        totalQuestions: total,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(quizAttempts.id, attemptId))
      .returning();

    // Award XP only the first time the user passes this quiz.
    let xpAwarded = 0;
    if (
      passed &&
      !(await this.hasPassedBefore(userId, attempt.quizId, attemptId))
    ) {
      xpAwarded = await this.grantXp(userId, quiz.xpReward ?? 0);

      // Same gate as the XP: a retake that passes again is not news.
      await notifyUser(
        this.userClient,
        {
          userId,
          type: 'quiz_passed',
          title: `Quiz passed: ${quiz.title}`,
          body: `You scored ${score}%.`,
          data: {
            quizId: attempt.quizId,
            attemptId,
            lessonId: quiz.lessonId,
            score,
          },
        },
        this.logger,
      );
    }

    const review = this.buildReview(
      questions,
      optionsByQuestion,
      answerByQuestion,
    );

    this.logger.log(
      `User ${userId} submitted attempt ${attemptId}: ${score}% (${passed ? 'pass' : 'fail'})`,
    );
    return new SubmitAttemptResponseDTO({
      attempt: new AttemptResponseDTO(updated),
      score,
      passed,
      correctAnswers: correct,
      total,
      earnedPoints,
      totalPoints,
      needsReview,
      xpAwarded,
      review,
    });
  }

  /**
   * The learner's attempts, newest first, labelled with what was attempted.
   *
   * The quiz/lesson/course titles are joined here rather than resolved by the
   * caller: an attempt row carries only a quizId, and a history list showing
   * "85% on <uuid>" is useless. Doing it client-side would be one request per
   * attempt.
   */
  async findAllByUser(userId: string): Promise<AttemptResponseDTO[]> {
    const rows = await this.db
      .select({
        attempt: quizAttempts,
        quizTitle: quizzes.title,
        lessonId: lessons.id,
        lessonTitle: lessons.title,
        courseSlug: courses.slug,
      })
      .from(quizAttempts)
      .leftJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
      .leftJoin(lessons, eq(quizzes.lessonId, lessons.id))
      .leftJoin(modules, eq(lessons.moduleId, modules.id))
      .leftJoin(courses, eq(modules.courseId, courses.id))
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.createdAt));

    return rows.map(
      (row) =>
        new AttemptResponseDTO({
          ...row.attempt,
          quizTitle: row.quizTitle ?? undefined,
          lessonId: row.lessonId ?? undefined,
          lessonTitle: row.lessonTitle ?? undefined,
          courseSlug: row.courseSlug ?? undefined,
        }),
    );
  }

  async findOne(userId: string, id: string): Promise<AttemptResponseDTO> {
    const [found] = await this.db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.id, id), eq(quizAttempts.userId, userId)))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Attempt not found');
    return new AttemptResponseDTO(found);
  }

  async findByQuiz(
    userId: string,
    quizId: string,
  ): Promise<AttemptResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(quizAttempts)
      .where(
        and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId)),
      )
      .orderBy(quizAttempts.createdAt);
    return rows.map((row) => new AttemptResponseDTO(row));
  }

  async findAnswers(
    userId: string,
    attemptId: string,
  ): Promise<AttemptAnswerResponseDTO[]> {
    await this.findOne(userId, attemptId);
    const rows = await this.db
      .select()
      .from(quizAttemptAnswers)
      .where(eq(quizAttemptAnswers.attemptId, attemptId));
    return rows.map((row) => new AttemptAnswerResponseDTO(row));
  }

  /**
   * Re-opens a finished attempt from the learner's history with the same
   * per-question review `submit` returned.
   *
   * Only completed attempts: an in-progress attempt's review would hand over
   * the answer key before the learner submits. The lesson access check
   * matches `start`/`submit` — the review repeats the lesson's questions.
   *
   * Questions are read as they are now, so a quiz edited since the attempt
   * shows its current wording; answers to since-deleted questions drop out.
   * The headline score is the stored one, so it always agrees with the
   * history list.
   */
  async review(
    userId: string,
    attemptId: string,
  ): Promise<AttemptReviewResponseDTO> {
    const [row] = await this.db
      .select({
        attempt: quizAttempts,
        quizTitle: quizzes.title,
        lessonId: lessons.id,
        lessonTitle: lessons.title,
        courseSlug: courses.slug,
      })
      .from(quizAttempts)
      .leftJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
      .leftJoin(lessons, eq(quizzes.lessonId, lessons.id))
      .leftJoin(modules, eq(lessons.moduleId, modules.id))
      .leftJoin(courses, eq(modules.courseId, courses.id))
      .where(
        and(eq(quizAttempts.id, attemptId), eq(quizAttempts.userId, userId)),
      )
      .limit(1);
    if (!row) throw new RpcNotFoundException('Attempt not found');
    const { attempt } = row;
    if (!attempt.completedAt) {
      throw new RpcBadRequestException('Attempt has not been submitted yet');
    }
    if (!row.lessonId) throw new RpcNotFoundException('Quiz not found');
    await this.entitlements.assertCanReadLesson({ id: row.lessonId }, userId);

    const { questions, optionsByQuestion } = await this.loadAnswerKey(
      attempt.quizId,
    );
    const answers = await this.db
      .select()
      .from(quizAttemptAnswers)
      .where(eq(quizAttemptAnswers.attemptId, attemptId));

    const answerByQuestion = new Map<string, GivenAnswer>();
    let earnedPoints = 0;
    let needsReview = 0;
    for (const ans of answers) {
      if (answerByQuestion.has(ans.questionId)) continue;
      answerByQuestion.set(ans.questionId, {
        selectedOptionId: ans.selectedOptionId ?? null,
        answerData: (ans.answerData as Record<string, unknown> | null) ?? null,
        isCorrect: ans.isCorrect ?? false,
        requiresReview: ans.requiresReview ?? false,
      });
      earnedPoints += ans.pointsAwarded ?? 0;
      if (ans.requiresReview) needsReview++;
    }

    const score = attempt.score ?? 0;
    return new AttemptReviewResponseDTO({
      attempt: new AttemptResponseDTO({
        ...attempt,
        quizTitle: row.quizTitle ?? undefined,
        lessonId: row.lessonId ?? undefined,
        lessonTitle: row.lessonTitle ?? undefined,
        courseSlug: row.courseSlug ?? undefined,
      }),
      score,
      passed: score >= PASS_THRESHOLD,
      correctAnswers: attempt.correctAnswers ?? 0,
      total: attempt.totalQuestions ?? questions.length,
      earnedPoints,
      totalPoints: questions.reduce((sum, q) => sum + (q.points ?? 1), 0),
      needsReview,
      review: this.buildReview(questions, optionsByQuestion, answerByQuestion),
    });
  }

  /**
   * A quiz's questions plus every option with `isCorrect` — the answer key.
   * Only for grading and for reviews of submitted attempts; never for `start`.
   */
  private async loadAnswerKey(quizId: string) {
    // Full question rows — `question`/`explanation`/`order` feed the review;
    // `correctAnswer`/`type`/`points` drive grading.
    const questions = await this.db
      .select({
        id: quizQuestions.id,
        type: quizQuestions.type,
        question: quizQuestions.question,
        explanation: quizQuestions.explanation,
        correctAnswer: quizQuestions.correctAnswer,
        points: quizQuestions.points,
        order: quizQuestions.order,
      })
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId));
    const questionIds = questions.map((q) => q.id);

    const allOptions = questionIds.length
      ? await this.db
          .select({
            id: quizOptions.id,
            questionId: quizOptions.questionId,
            answer: quizOptions.answer,
            isCorrect: quizOptions.isCorrect,
          })
          .from(quizOptions)
          .where(inArray(quizOptions.questionId, questionIds))
      : [];
    const optionsByQuestion = new Map<string, typeof allOptions>();
    const correctByQuestion = new Map<string, Set<string>>();
    for (const o of allOptions) {
      if (!optionsByQuestion.has(o.questionId))
        optionsByQuestion.set(o.questionId, []);
      optionsByQuestion.get(o.questionId)!.push(o);
      if (o.isCorrect) {
        if (!correctByQuestion.has(o.questionId))
          correctByQuestion.set(o.questionId, new Set());
        correctByQuestion.get(o.questionId)!.add(o.id);
      }
    }
    return { questions, optionsByQuestion, correctByQuestion };
  }

  /**
   * Per-question review — the study payload: what the student answered,
   * whether it was right, the correct answer, and why. Only ever built for a
   * submitted attempt, so it can't be used to cheat.
   */
  private buildReview(
    questions: Awaited<
      ReturnType<AttemptService['loadAnswerKey']>
    >['questions'],
    optionsByQuestion: Awaited<
      ReturnType<AttemptService['loadAnswerKey']>
    >['optionsByQuestion'],
    answerByQuestion: Map<string, GivenAnswer>,
  ) {
    return [...questions]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((q) => {
        const given = answerByQuestion.get(q.id) ?? null;
        return {
          questionId: q.id,
          type: q.type,
          question: q.question,
          explanation: q.explanation ?? null,
          points: q.points ?? 1,
          options: (optionsByQuestion.get(q.id) ?? []).map((o) => ({
            id: o.id,
            answer: o.answer,
            isCorrect: o.isCorrect ?? false,
          })),
          correctAnswer: q.correctAnswer ?? null,
          yourAnswer: given
            ? {
                selectedOptionId: given.selectedOptionId,
                answerData: given.answerData,
              }
            : null,
          isCorrect: given?.isCorrect ?? false,
          requiresReview: given?.requiresReview ?? false,
        };
      });
  }

  /**
   * Builds the renderable half of a question whose prompt lives in
   * `correctAnswer`. Matching needs its left items plus a shuffled pool of
   * right items; returning the pairs as authored would hand over the answer.
   */
  private buildPrompt(question: {
    type: string;
    correctAnswer: unknown;
  }): Record<string, unknown> | null {
    if (question.type !== 'matching') return null;
    const pairs = (question.correctAnswer as { pairs?: unknown })?.pairs;
    if (!Array.isArray(pairs)) return null;
    const lefts = pairs.map((p: { left: string }) => p.left);
    const rights = pairs.map((p: { right: string }) => p.right);
    return { lefts, rights: this.shuffle(rights) };
  }

  private shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  private async hasPassedBefore(
    userId: string,
    quizId: string,
    exceptAttemptId: string,
  ) {
    const prior = await this.db
      .select({ id: quizAttempts.id, score: quizAttempts.score })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, userId),
          eq(quizAttempts.quizId, quizId),
          isNotNull(quizAttempts.completedAt),
        ),
      );
    return prior.some(
      (a) => a.id !== exceptAttemptId && (a.score ?? 0) >= PASS_THRESHOLD,
    );
  }

  private async grantXp(userId: string, amount: number): Promise<number> {
    if (amount <= 0) return 0;
    try {
      await firstValueFrom(
        this.userClient
          .send(USER_SERVICE.ACTIONS.ADD_XP, { userId, amount })
          .pipe(timeout(5000)),
      );
      return amount;
    } catch (error) {
      this.logger.error(
        `Failed to award quiz XP to ${userId}: ${error instanceof Error ? error.message : error}`,
      );
      return 0;
    }
  }
}
