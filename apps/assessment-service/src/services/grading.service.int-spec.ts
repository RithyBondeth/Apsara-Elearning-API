import { Observable, of } from 'rxjs';
import type { CourseEntitlementService } from '@app/common';
import { modules } from '@app/database/schemas/course/module.schema';
import { lessons } from '@app/database/schemas/course/lessons/lesson.schema';
import { quizzes } from '@app/database/schemas/course/quizzes/quiz.schema';
import { quizQuestions } from '@app/database/schemas/course/quizzes/quiz-question.schema';
import {
  createCourse,
  createUser,
  openTestDb,
  resetDb,
} from '../../../../test/db/test-db';
import { AttemptService } from './attempt.service';
import { GradingService } from './grading.service';

/**
 * Manual grading against real rows: a quiz with one auto-graded question
 * (1 point) and one short answer nobody wrote an answer key for (3 points).
 * Submitting scores 25% with the short answer pending; grading it rescores
 * the attempt, unlocks first-pass XP exactly once, and tells the learner.
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
const attempts = new AttemptService(
  db as never,
  userClient as never,
  entitlements,
);
const grading = new GradingService(db as never, userClient as never);

const sent = (pattern: string) =>
  userClient.send.mock.calls.filter(([p]) => p === pattern);

let learner: string;
let admin: string;
let quizId: string;
let autoQ: string;
let essayQ: string;

async function submit(essayText = 'Water and carbon dioxide', autoValue = 5) {
  const { attempt } = await attempts.start(learner, quizId);
  const result = await attempts.submit(learner, attempt.id, [
    { questionId: autoQ, answerData: { value: autoValue } },
    { questionId: essayQ, answerData: { text: essayText } },
  ] as never);
  return { attemptId: attempt.id, result };
}

async function pendingAnswerFor(attemptId: string) {
  const items = await grading.list('pending');
  const item = items.find((i) => i.attemptId === attemptId);
  if (!item) throw new Error('expected a pending answer');
  return item;
}

afterAll(() => sql.end({ timeout: 1 }));

beforeEach(async () => {
  await resetDb(sql);
  userClient.send.mockClear();
  learner = (await createUser(db, { firstName: 'Sok', lastName: 'Dara' })).id;
  admin = (await createUser(db, { isAdmin: true })).id;
  const course = await createCourse(db, {
    published: true,
    title: 'Grade 12 Biology',
  });
  const [mod] = await db
    .insert(modules)
    .values({ courseId: course.id, title: 'Module' })
    .returning();
  const [lesson] = await db
    .insert(lessons)
    .values({ moduleId: mod.id, title: 'Photosynthesis', slug: 'photo' })
    .returning();
  const [quiz] = await db
    .insert(quizzes)
    .values({ lessonId: lesson.id, title: 'Photosynthesis quiz', xpReward: 25 })
    .returning();
  quizId = quiz.id;
  const [auto] = await db
    .insert(quizQuestions)
    .values({
      quizId,
      type: 'numeric',
      question: 'How many?',
      correctAnswer: { value: 5 },
      points: 1,
      order: 0,
    })
    .returning();
  const [essay] = await db
    .insert(quizQuestions)
    .values({
      quizId,
      type: 'short_answer',
      question: 'Name the inputs of photosynthesis.',
      correctAnswer: null,
      points: 3,
      order: 1,
    })
    .returning();
  autoQ = auto.id;
  essayQ = essay.id;
});

describe('GradingService', () => {
  it('queues the short answer with what a grader needs', async () => {
    const { attemptId, result } = await submit();
    expect(result.score).toBe(25);
    expect(result.needsReview).toBe(1);

    const item = await pendingAnswerFor(attemptId);
    expect(item).toMatchObject({
      status: 'pending',
      question: 'Name the inputs of photosynthesis.',
      answerText: 'Water and carbon dioxide',
      maxPoints: 3,
      learnerName: 'Sok Dara',
      courseTitle: 'Grade 12 Biology',
      quizTitle: 'Photosynthesis quiz',
    });
  });

  it('rescores the attempt, awards first-pass XP once and tells the learner', async () => {
    const { attemptId } = await submit();
    const item = await pendingAnswerFor(attemptId);
    userClient.send.mockClear();

    const graded = await grading.grade(admin, item.answerId, {
      points: 3,
      feedback: '  Both named — well done.  ',
    });

    expect(graded).toMatchObject({
      attemptScore: 100,
      attemptPassed: true,
      stillPending: 0,
      xpAwarded: 25,
    });
    expect(graded.item).toMatchObject({
      status: 'graded',
      pointsAwarded: 3,
      feedback: 'Both named — well done.',
    });
    expect(sent('user.add_xp')).toHaveLength(1);
    const [[, notification]] = sent('user.notification.create');
    expect(notification).toMatchObject({
      userId: learner,
      type: 'quiz_graded',
      body: 'Your score is 100%.',
    });
    expect(await grading.list('pending')).toEqual([]);
    expect(await grading.list('graded')).toHaveLength(1);
  });

  it('never awards the XP twice when an answer is regraded', async () => {
    const { attemptId } = await submit();
    const { answerId } = await pendingAnswerFor(attemptId);

    await grading.grade(admin, answerId, { points: 3 });
    const down = await grading.grade(admin, answerId, { points: 0 });
    const up = await grading.grade(admin, answerId, { points: 3 });

    expect(down).toMatchObject({ attemptScore: 25, attemptPassed: false });
    expect(up).toMatchObject({ attemptScore: 100, xpAwarded: 0 });
    expect(sent('user.add_xp')).toHaveLength(1);
  });

  it('gives no XP when another attempt of the quiz already passed', async () => {
    // A first attempt passes at submit (full marks on the auto question
    // aren't enough alone, so grade its essay too).
    const first = await submit();
    await grading.grade(
      admin,
      (await pendingAnswerFor(first.attemptId)).answerId,
      {
        points: 3,
      },
    );
    const second = await submit();
    userClient.send.mockClear();

    const graded = await grading.grade(
      admin,
      (await pendingAnswerFor(second.attemptId)).answerId,
      { points: 3 },
    );

    expect(graded).toMatchObject({ attemptPassed: true, xpAwarded: 0 });
    expect(sent('user.add_xp')).toHaveLength(0);
  });

  it('shows the learner the reviewer’s points and feedback', async () => {
    const { attemptId } = await submit();
    const before = await attempts.review(learner, attemptId);
    expect(before.needsReview).toBe(1);
    expect(before.review[1]).toMatchObject({
      requiresReview: true,
      pointsAwarded: 0,
      reviewFeedback: null,
    });

    await grading.grade(admin, (await pendingAnswerFor(attemptId)).answerId, {
      points: 2,
      feedback: 'Name both gases.',
    });
    const after = await attempts.review(learner, attemptId);

    expect(after.needsReview).toBe(0);
    expect(after.score).toBe(75);
    expect(after.review[1]).toMatchObject({
      requiresReview: false,
      isCorrect: false,
      pointsAwarded: 2,
      reviewFeedback: 'Name both gases.',
    });
  });

  it('refuses out-of-range points, auto-graded answers and unknown ids', async () => {
    const { attemptId } = await submit();
    const { answerId } = await pendingAnswerFor(attemptId);
    const [auto] = await sql<{ id: string }[]>`
      SELECT id FROM quiz_attempt_answers
      WHERE attempt_id = ${attemptId} AND requires_review = false`;

    await expect(
      grading.grade(admin, answerId, { points: 4 }),
    ).rejects.toMatchObject({ error: { statusCode: 400 } });
    await expect(
      grading.grade(admin, auto.id, { points: 1 }),
    ).rejects.toMatchObject({ error: { statusCode: 400 } });
    await expect(
      grading.grade(admin, '00000000-0000-0000-0000-000000000000', {
        points: 1,
      }),
    ).rejects.toMatchObject({ error: { statusCode: 404 } });
  });
});
