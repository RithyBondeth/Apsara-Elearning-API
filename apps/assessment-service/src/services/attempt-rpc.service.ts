import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import { quizzes } from '@app/database/schemas/course/quizzes/quiz.schema';
import { quizQuestions } from '@app/database/schemas/course/quizzes/quiz-question.schema';
import { quizOptions } from '@app/database/schemas/course/quizzes/quiz-option.schema';
import { quizAttempts } from '@app/database/schemas/course/quizzes/quiz-attempt.schema';
import { quizAttemptAnswers } from '@app/database/schemas/course/quizzes/quiz-attempt-answer.schema';
import { AttemptAnswerDTO, DRIZZLE, USER_SERVICE } from '@app/contracts';
import { RpcBadRequestException, RpcNotFoundException } from '@app/common';
import { gradeAnswer, GradableQuestion } from './graders';

const PASS_THRESHOLD = 70;

@Injectable()
export class AttemptRpcService {
  private readonly logger = new Logger(AttemptRpcService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: NeonHttpDatabase<any>,
    @Inject(USER_SERVICE.NAME) private readonly userClient: ClientProxy,
  ) {}

  /** Creates an attempt and returns the quiz with all answer keys stripped. */
  async start(userId: string, quizId: string) {
    const [quiz] = await this.db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1);
    if (!quiz) throw new RpcNotFoundException('Quiz not found');

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

    return {
      attempt,
      quiz,
      questions: questions.map((q) => ({
        id: q.id,
        type: q.type,
        question: q.question,
        points: q.points,
        order: q.order,
        // NOTE: options intentionally exclude `isCorrect`, and `correctAnswer`
        // is never returned — only the renderable prompt derived from it.
        options: options
          .filter((o) => o.questionId === q.id)
          .map((o) => ({ id: o.id, answer: o.answer })),
        prompt: this.buildPrompt(q),
      })),
    };
  }

  async submit(userId: string, attemptId: string, answers: AttemptAnswerDTO[]) {
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

    const questions = await this.db
      .select({
        id: quizQuestions.id,
        type: quizQuestions.type,
        correctAnswer: quizQuestions.correctAnswer,
        points: quizQuestions.points,
      })
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, attempt.quizId));
    const questionById = new Map<string, GradableQuestion>(
      questions.map((q) => [q.id, q]),
    );
    const questionIds = questions.map((q) => q.id);

    // Correct option ids per question, for choice-based types.
    const correctOptions = questionIds.length
      ? await this.db
          .select({ id: quizOptions.id, questionId: quizOptions.questionId })
          .from(quizOptions)
          .where(
            and(
              inArray(quizOptions.questionId, questionIds),
              eq(quizOptions.isCorrect, true),
            ),
          )
      : [];
    const correctByQuestion = new Map<string, Set<string>>();
    for (const o of correctOptions) {
      if (!correctByQuestion.has(o.questionId))
        correctByQuestion.set(o.questionId, new Set());
      correctByQuestion.get(o.questionId)!.add(o.id);
    }

    // Grade each submitted answer (one per question, first write wins).
    const seen = new Set<string>();
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
    }

    this.logger.log(
      `User ${userId} submitted attempt ${attemptId}: ${score}% (${passed ? 'pass' : 'fail'})`,
    );
    return {
      attempt: updated,
      score,
      passed,
      correctAnswers: correct,
      total,
      earnedPoints,
      totalPoints,
      needsReview,
      xpAwarded,
    };
  }

  findAllByUser(userId: string) {
    return this.db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(quizAttempts.createdAt);
  }

  async findOne(id: string) {
    const [found] = await this.db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Attempt not found');
    return found;
  }

  findByQuiz(userId: string, quizId: string) {
    return this.db
      .select()
      .from(quizAttempts)
      .where(
        and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId)),
      )
      .orderBy(quizAttempts.createdAt);
  }

  findAnswers(attemptId: string) {
    return this.db
      .select()
      .from(quizAttemptAnswers)
      .where(eq(quizAttemptAnswers.attemptId, attemptId));
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
