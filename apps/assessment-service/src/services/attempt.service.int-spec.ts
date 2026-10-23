import { eq } from 'drizzle-orm';
import { Observable, of } from 'rxjs';
import type { CourseEntitlementService } from '@app/common';
import { modules } from '@app/database/schemas/course/module.schema';
import { lessons } from '@app/database/schemas/course/lessons/lesson.schema';
import { quizzes } from '@app/database/schemas/course/quizzes/quiz.schema';
import { quizQuestions } from '@app/database/schemas/course/quizzes/quiz-question.schema';
import { quizAttemptAnswers } from '@app/database/schemas/course/quizzes/quiz-attempt-answer.schema';
import {
  createCourse,
  createUser,
  openTestDb,
  resetDb,
} from '../../../../test/db/test-db';
import { AttemptService } from './attempt.service';

/**
 * Concurrent submits — a double-click, or two tabs — against real rows. Only
 * the database can show that exactly one request wins the attempt and that
 * first-pass XP is granted once.
 */
const { sql, db } = openTestDb();
const userClient = {
  send: jest.fn<Observable<unknown>, [pattern: string, payload: unknown]>(() =>
    of({}),
  ),
};
const entitlements = {
  assertCanReadLesson: jest.fn().mockResolvedValue(undefined),
} as unknown as CourseEntitlementService;
const service = new AttemptService(
  db as never,
  userClient as never,
  entitlements,
);

let learner: string;
let quizId: string;
const answers: { questionId: string; answerData: { value: number } }[] = [];

const xpGrants = () =>
  userClient.send.mock.calls.filter(([pattern]) => pattern === 'user.add_xp')
    .length;

afterAll(() => sql.end({ timeout: 1 }));

beforeAll(async () => {
  await resetDb(sql);
  learner = (await createUser(db)).id;
  const course = await createCourse(db, { published: true });
  const [mod] = await db
    .insert(modules)
    .values({ courseId: course.id, title: 'Module' })
    .returning();
  const [lesson] = await db
    .insert(lessons)
    .values({ moduleId: mod.id, title: 'Lesson', slug: 'lesson' })
    .returning();
  const [quiz] = await db
    .insert(quizzes)
    .values({ lessonId: lesson.id, title: 'Quiz', xpReward: 25 })
    .returning();
  quizId = quiz.id;
  for (const [order, value] of [5, 10].entries()) {
    const [q] = await db
      .insert(quizQuestions)
      .values({
        quizId,
        type: 'numeric',
        question: `q${order}`,
        correctAnswer: { value },
        order,
      })
      .returning();
    answers.push({ questionId: q.id, answerData: { value } });
  }
});

beforeEach(() => userClient.send.mockClear());

describe('AttemptService.submit under concurrency', () => {
  it('accepts one of two simultaneous submits of the same attempt', async () => {
    const { attempt } = await service.start(learner, quizId);

    const results = await Promise.allSettled([
      service.submit(learner, attempt.id, answers as never),
      service.submit(learner, attempt.id, answers as never),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const [rejected] = results.filter((r) => r.status === 'rejected');
    expect(rejected).toMatchObject({
      reason: { error: { statusCode: 400 } },
    });
    const rows = await db
      .select()
      .from(quizAttemptAnswers)
      .where(eq(quizAttemptAnswers.attemptId, attempt.id));
    expect(rows).toHaveLength(answers.length);
    expect(xpGrants()).toBe(1);
  });

  it('grants first-pass XP once when several passing attempts land together', async () => {
    await resetDb(sql);
    // resetDb empties every table, so rebuild what the suite needs.
    learner = (await createUser(db)).id;
    const course = await createCourse(db, { published: true });
    const [mod] = await db
      .insert(modules)
      .values({ courseId: course.id, title: 'Module' })
      .returning();
    const [lesson] = await db
      .insert(lessons)
      .values({ moduleId: mod.id, title: 'Lesson', slug: 'lesson' })
      .returning();
    const [quiz] = await db
      .insert(quizzes)
      .values({ lessonId: lesson.id, title: 'Quiz', xpReward: 25 })
      .returning();
    const [q] = await db
      .insert(quizQuestions)
      .values({
        quizId: quiz.id,
        type: 'numeric',
        question: 'q',
        correctAnswer: { value: 7 },
      })
      .returning();
    const answer = [{ questionId: q.id, answerData: { value: 7 } }];

    const started = [];
    for (let i = 0; i < 4; i++)
      started.push(await service.start(learner, quiz.id));
    const results = await Promise.all(
      started.map(({ attempt }) =>
        service.submit(learner, attempt.id, answer as never),
      ),
    );

    expect(results.every((r) => r.passed)).toBe(true);
    expect(results.map((r) => r.xpAwarded).sort()).toEqual([0, 0, 0, 25]);
    expect(xpGrants()).toBe(1);
  });
});
