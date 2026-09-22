import { CourseEntitlementService } from '@app/common';
import { of, throwError } from 'rxjs';
import { AttemptService } from './attempt.service';

/**
 * The quiz attempt lifecycle: `start` must never leak an answer key, and
 * `submit` must grade with point weighting, gate first-pass XP, and stay
 * resilient when the XP grant to user-service fails.
 */

/**
 * Ordered heterogeneous Drizzle stand-in. `selects`/`inserts`/`updates` are
 * consumed in call order; `insertedValues` captures what was written.
 */
function fakeDb(
  opts: { selects?: unknown[][]; inserts?: unknown[][]; updates?: unknown[][] } = {},
) {
  const selects = opts.selects ?? [];
  const inserts = opts.inserts ?? [];
  const updates = opts.updates ?? [];
  let si = 0;
  let ii = 0;
  let ui = 0;
  const insertedValues: unknown[] = [];
  const db = {
    select: () => {
      const idx = si++;
      const node: Record<string, unknown> = {};
      for (const m of ['from', 'leftJoin', 'innerJoin', 'where', 'orderBy', 'groupBy', 'limit', 'offset']) {
        node[m] = () => node;
      }
      node.then = (res: (v: unknown) => unknown, rej: (r: unknown) => unknown) =>
        Promise.resolve(selects[idx] ?? []).then(res, rej);
      return node;
    },
    insert: () => ({
      values: (v: unknown) => {
        insertedValues.push(v);
        const idx = ii++;
        return {
          returning: () => Promise.resolve(inserts[idx] ?? []),
          then: (res: (v: unknown) => unknown, rej: (r: unknown) => unknown) =>
            Promise.resolve(undefined).then(res, rej),
        };
      },
    }),
    update: () => ({
      set: () => ({
        where: () => ({ returning: () => Promise.resolve(updates[ui++] ?? []) }),
      }),
    }),
  };
  return { db, insertedValues };
}

const entitlements = {
  assertCanReadLesson: jest.fn().mockResolvedValue(undefined),
} as unknown as CourseEntitlementService;

/** ClientProxy whose ADD_XP send succeeds (of) or fails (throwError). */
function userClient(ok = true) {
  return { send: jest.fn().mockReturnValue(ok ? of({}) : throwError(() => new Error('down'))) };
}

const numericQ = (id: string, value: number, points = 1, order = 0) => ({
  id,
  type: 'numeric',
  question: `q${id}`,
  explanation: null,
  correctAnswer: { value },
  points,
  order,
});

beforeEach(() => jest.clearAllMocks());

describe('AttemptService.start', () => {
  it('throws 404 when the quiz is missing', async () => {
    const { db } = fakeDb({ selects: [[]] });
    const service = new AttemptService(db as never, userClient() as never, entitlements);
    await expect(service.start('u1', 'q1')).rejects.toMatchObject({ error: { statusCode: 404 } });
  });

  it('throws 400 when the quiz has no questions', async () => {
    const { db } = fakeDb({ selects: [[{ id: 'q1', lessonId: 'l1' }], []] });
    const service = new AttemptService(db as never, userClient() as never, entitlements);
    await expect(service.start('u1', 'q1')).rejects.toMatchObject({ error: { statusCode: 400 } });
  });

  it('returns the quiz with answer keys stripped', async () => {
    const quiz = { id: 'q1', lessonId: 'l1', title: 'Quiz' };
    const questions = [
      { id: 'qq1', type: 'multiple_choice', question: 'Pick', points: 1, order: 0, correctAnswer: { secret: true } },
    ];
    const options = [{ id: 'o1', questionId: 'qq1', answer: 'A' }];
    const { db } = fakeDb({ selects: [[quiz], questions, options], inserts: [[{ id: 'a1' }]] });
    const service = new AttemptService(db as never, userClient() as never, entitlements);

    const res = await service.start('u1', 'q1');
    const q = res.questions[0] as Record<string, unknown>;

    expect(q).not.toHaveProperty('correctAnswer');
    expect(q.options).toEqual([{ id: 'o1', answer: 'A' }]);
    expect(q.options[0]).not.toHaveProperty('isCorrect');
  });
});

describe('AttemptService.submit guards', () => {
  const svc = (selects: unknown[][]) =>
    new AttemptService(fakeDb({ selects }).db as never, userClient() as never, entitlements);

  it('throws 404 when the attempt is missing', async () => {
    await expect(svc([[]]).submit('u1', 'a1', [])).rejects.toMatchObject({ error: { statusCode: 404 } });
  });

  it('throws 400 when the attempt belongs to another user', async () => {
    const attempt = [{ id: 'a1', userId: 'someone-else', quizId: 'q1', completedAt: null }];
    await expect(svc([attempt]).submit('u1', 'a1', [])).rejects.toMatchObject({ error: { statusCode: 400 } });
  });

  it('throws 400 when the attempt is already submitted', async () => {
    const attempt = [{ id: 'a1', userId: 'u1', quizId: 'q1', completedAt: new Date() }];
    await expect(svc([attempt]).submit('u1', 'a1', [])).rejects.toMatchObject({ error: { statusCode: 400 } });
  });

  it('throws 404 when the quiz is missing', async () => {
    const attempt = [{ id: 'a1', userId: 'u1', quizId: 'q1', completedAt: null }];
    await expect(svc([attempt, []]).submit('u1', 'a1', [])).rejects.toMatchObject({ error: { statusCode: 404 } });
  });

  it('throws 400 for an answer whose question is not in the quiz', async () => {
    const attempt = [{ id: 'a1', userId: 'u1', quizId: 'q1', totalQuestions: 1, completedAt: null }];
    const quiz = [{ id: 'q1', lessonId: 'l1', xpReward: 25 }];
    const questions = [numericQ('qq1', 5)];
    const service = svc([attempt, quiz, questions, []]);
    await expect(
      service.submit('u1', 'a1', [{ questionId: 'ghost', answerData: { value: 5 } }] as never),
    ).rejects.toMatchObject({ error: { statusCode: 400 } });
  });
});

describe('AttemptService.submit scoring and XP', () => {
  const attempt = (n: number) => [{ id: 'a1', userId: 'u1', quizId: 'q1', totalQuestions: n, completedAt: null }];
  const quiz = [{ id: 'q1', lessonId: 'l1', xpReward: 25 }];

  it('scores a fully-correct attempt at 100%, passes, and awards first-pass XP', async () => {
    const questions = [numericQ('qq1', 5, 1, 0), numericQ('qq2', 10, 1, 1)];
    const { db } = fakeDb({
      selects: [attempt(2), quiz, questions, [], []], // ..., allOptions, prior-attempts
      updates: [[{ id: 'a1', score: 100 }]],
    });
    const uc = userClient(true);
    const service = new AttemptService(db as never, uc as never, entitlements);

    const res = await service.submit('u1', 'a1', [
      { questionId: 'qq1', answerData: { value: 5 } },
      { questionId: 'qq2', answerData: { value: 10 } },
    ] as never);

    expect(res.score).toBe(100);
    expect(res.passed).toBe(true);
    expect(res.correctAnswers).toBe(2);
    expect(res.earnedPoints).toBe(2);
    expect(res.totalPoints).toBe(2);
    expect(res.needsReview).toBe(0);
    expect(res.xpAwarded).toBe(25);
    expect(uc.send).toHaveBeenCalledTimes(1);
  });

  it('weights the score by question points', async () => {
    // 3-point question right, 1-point wrong -> 3/4 -> 75% -> pass.
    const questions = [numericQ('qq1', 5, 3, 0), numericQ('qq2', 10, 1, 1)];
    const { db } = fakeDb({
      selects: [attempt(2), quiz, questions, [], []],
      updates: [[{ id: 'a1', score: 75 }]],
    });
    const service = new AttemptService(db as never, userClient() as never, entitlements);

    const res = await service.submit('u1', 'a1', [
      { questionId: 'qq1', answerData: { value: 5 } },
      { questionId: 'qq2', answerData: { value: 999 } },
    ] as never);

    expect(res.earnedPoints).toBe(3);
    expect(res.totalPoints).toBe(4);
    expect(res.score).toBe(75);
    expect(res.passed).toBe(true);
  });

  it('fails below 70% and awards no XP', async () => {
    const questions = [numericQ('qq1', 5, 1, 0), numericQ('qq2', 10, 1, 1)];
    const { db } = fakeDb({ selects: [attempt(2), quiz, questions, []], updates: [[{ id: 'a1' }]] });
    const uc = userClient();
    const service = new AttemptService(db as never, uc as never, entitlements);

    const res = await service.submit('u1', 'a1', [
      { questionId: 'qq1', answerData: { value: 0 } },
      { questionId: 'qq2', answerData: { value: 0 } },
    ] as never);

    expect(res.score).toBe(0);
    expect(res.passed).toBe(false);
    expect(res.xpAwarded).toBe(0);
    expect(uc.send).not.toHaveBeenCalled();
  });

  it('takes the first answer when a question is answered twice', async () => {
    const questions = [numericQ('qq1', 5, 1, 0)];
    const { db, insertedValues } = fakeDb({
      selects: [attempt(1), quiz, questions, [], []],
      updates: [[{ id: 'a1' }]],
    });
    const service = new AttemptService(db as never, userClient() as never, entitlements);

    const res = await service.submit('u1', 'a1', [
      { questionId: 'qq1', answerData: { value: 5 } }, // first: correct
      { questionId: 'qq1', answerData: { value: 999 } }, // duplicate: ignored
    ] as never);

    expect(res.correctAnswers).toBe(1);
    expect(res.score).toBe(100);
    expect(insertedValues).toHaveLength(1); // only one answer row written
  });

  it('does not re-award XP when the user already passed this quiz before', async () => {
    const questions = [numericQ('qq1', 5, 1, 0)];
    const priorPass = [{ id: 'older', score: 90 }];
    const { db } = fakeDb({
      selects: [attempt(1), quiz, questions, [], priorPass],
      updates: [[{ id: 'a1' }]],
    });
    const uc = userClient();
    const service = new AttemptService(db as never, uc as never, entitlements);

    const res = await service.submit('u1', 'a1', [
      { questionId: 'qq1', answerData: { value: 5 } },
    ] as never);

    expect(res.passed).toBe(true);
    expect(res.xpAwarded).toBe(0);
    expect(uc.send).not.toHaveBeenCalled();
  });

  it('still completes the submission when the XP grant fails', async () => {
    const questions = [numericQ('qq1', 5, 1, 0)];
    const { db } = fakeDb({
      selects: [attempt(1), quiz, questions, [], []],
      updates: [[{ id: 'a1' }]],
    });
    const service = new AttemptService(db as never, userClient(false) as never, entitlements);

    const res = await service.submit('u1', 'a1', [
      { questionId: 'qq1', answerData: { value: 5 } },
    ] as never);

    expect(res.passed).toBe(true);
    expect(res.xpAwarded).toBe(0); // grant failed, but the attempt still scored
  });

  it('flags an ungradeable answer for review instead of marking it wrong', async () => {
    // short_answer with no accepted list -> requiresReview, never silently 0.
    const questions = [
      { id: 'qq1', type: 'short_answer', question: 'Explain', explanation: null, correctAnswer: {}, points: 1, order: 0 },
    ];
    const { db } = fakeDb({ selects: [attempt(1), quiz, questions, []], updates: [[{ id: 'a1' }]] });
    const service = new AttemptService(db as never, userClient() as never, entitlements);

    const res = await service.submit('u1', 'a1', [
      { questionId: 'qq1', answerData: { text: 'anything' } },
    ] as never);

    expect(res.needsReview).toBe(1);
    expect(res.correctAnswers).toBe(0);
    expect(res.passed).toBe(false);
  });
});
