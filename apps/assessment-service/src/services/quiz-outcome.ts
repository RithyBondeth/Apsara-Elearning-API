import { Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { firstValueFrom, timeout } from 'rxjs';
import { quizAttempts } from '@app/database/schemas/course/quizzes/quiz-attempt.schema';
import { USER_SERVICE } from '@app/contracts';

/**
 * Pass/XP rules shared by quiz submission and manual grading, which can both
 * change whether an attempt passes.
 */

export const PASS_THRESHOLD = 70;

/** Anything that can run queries: the database or an open transaction. */
export type QuizDb = Pick<PostgresJsDatabase<any>, 'select' | 'execute'>;

/**
 * Serialises everything that can change one learner's result on one quiz —
 * parallel submits, and grading — for the rest of the transaction.
 */
export async function lockLearnerQuiz(
  tx: QuizDb,
  userId: string,
  quizId: string,
): Promise<void> {
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtextextended(${`quiz-submit:${userId}:${quizId}`}, 0))`,
  );
}

/** Whether any other completed attempt of this quiz already passed. */
export async function hasPassedBefore(
  db: QuizDb,
  userId: string,
  quizId: string,
  exceptAttemptId: string,
): Promise<boolean> {
  const prior = await db
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

/**
 * Awards XP through user-service — best effort: a broker hiccup must not
 * undo the score that earned it. Returns what was actually granted.
 */
export async function grantXp(
  userClient: ClientProxy,
  logger: Logger,
  userId: string,
  amount: number,
): Promise<number> {
  if (amount <= 0) return 0;
  try {
    await firstValueFrom(
      userClient
        .send(USER_SERVICE.ACTIONS.ADD_XP, { userId, amount })
        .pipe(timeout(5000)),
    );
    return amount;
  } catch (error) {
    logger.error(
      `Failed to award quiz XP to ${userId}: ${error instanceof Error ? error.message : error}`,
    );
    return 0;
  }
}
