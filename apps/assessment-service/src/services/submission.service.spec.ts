import { CourseEntitlementService } from '@app/common';
import { of, throwError } from 'rxjs';
import { SubmissionService } from './submission.service';
import type { ChallengeService } from './challenge.service';
import type { CodeExecutionService } from '../execution/code-execution.service';
import type { ExecutionResult } from '../execution/code-execution.service';

/**
 * Coding-challenge submissions: the score is round(passed/total*100), XP is
 * granted only the first time the user fully passes, and the executor's mock
 * flag is reported to the client.
 */

function fakeDb(opts: { inserts?: unknown[][]; selects?: unknown[][] } = {}) {
  const inserts = opts.inserts ?? [];
  const selects = opts.selects ?? [];
  let ii = 0;
  let si = 0;
  const db = {
    insert: () => ({
      values: () => ({ returning: () => Promise.resolve(inserts[ii++] ?? []) }),
    }),
    select: () => {
      const idx = si++;
      const node: Record<string, unknown> = {};
      for (const m of ['from', 'leftJoin', 'where', 'orderBy', 'limit']) node[m] = () => node;
      node.then = (res: (v: unknown) => unknown, rej: (r: unknown) => unknown) =>
        Promise.resolve(selects[idx] ?? []).then(res, rej);
      return node;
    },
  };
  return { db };
}

const entitlements = {
  assertCanReadLesson: jest.fn().mockResolvedValue(undefined),
} as unknown as CourseEntitlementService;

function challenges() {
  return {
    findChallenge: jest.fn().mockResolvedValue({ id: 'c1', lessonId: 'l1', xpReward: 50 }),
    findTestCases: jest.fn().mockResolvedValue([{ input: null, expectedOutput: '1' }]),
  } as unknown as ChallengeService;
}

function executor(result: Partial<ExecutionResult>) {
  const full: ExecutionResult = {
    passed: 0,
    total: 0,
    allPassed: false,
    executionTimeMs: 0,
    errorMessage: null,
    mock: true,
    ...result,
  };
  return { grade: jest.fn().mockResolvedValue(full) } as unknown as CodeExecutionService;
}

function userClient(ok = true) {
  return { send: jest.fn().mockReturnValue(ok ? of({}) : throwError(() => new Error('down'))) };
}

const dto = { language: 'javascript', sourceCode: 'print(1)' } as never;

beforeEach(() => jest.clearAllMocks());

describe('SubmissionService.create', () => {
  it('scores by passed/total and awards first-solve XP on a full pass', async () => {
    const { db } = fakeDb({ inserts: [[{ id: 's1' }]], selects: [[]] }); // no prior pass
    const uc = userClient(true);
    const service = new SubmissionService(
      db as never,
      uc as never,
      challenges(),
      executor({ passed: 2, total: 2, allPassed: true }),
      entitlements,
    );

    const res = await service.create('u1', 'c1', dto);

    expect(res.score).toBe(100);
    expect(res.passed).toBe(true);
    expect(res.testCasesPassed).toBe(2);
    expect(res.xpAwarded).toBe(50);
    expect(uc.send).toHaveBeenCalledTimes(1);
  });

  it('computes a partial score and awards no XP when not all cases pass', async () => {
    const { db } = fakeDb({ inserts: [[{ id: 's1' }]] });
    const uc = userClient();
    const service = new SubmissionService(
      db as never,
      uc as never,
      challenges(),
      executor({ passed: 3, total: 4, allPassed: false }),
      entitlements,
    );

    const res = await service.create('u1', 'c1', dto);

    expect(res.score).toBe(75);
    expect(res.passed).toBe(false);
    expect(res.xpAwarded).toBe(0);
    expect(uc.send).not.toHaveBeenCalled();
  });

  it('does not re-award XP when the user already solved the challenge', async () => {
    const { db } = fakeDb({ inserts: [[{ id: 's1' }]], selects: [[{ id: 'older' }]] });
    const uc = userClient();
    const service = new SubmissionService(
      db as never,
      uc as never,
      challenges(),
      executor({ passed: 2, total: 2, allPassed: true }),
      entitlements,
    );

    const res = await service.create('u1', 'c1', dto);

    expect(res.passed).toBe(true);
    expect(res.xpAwarded).toBe(0);
    expect(uc.send).not.toHaveBeenCalled();
  });

  it('still records the submission when the XP grant fails', async () => {
    const { db } = fakeDb({ inserts: [[{ id: 's1' }]], selects: [[]] });
    const service = new SubmissionService(
      db as never,
      userClient(false) as never,
      challenges(),
      executor({ passed: 2, total: 2, allPassed: true }),
      entitlements,
    );

    const res = await service.create('u1', 'c1', dto);

    expect(res.passed).toBe(true);
    expect(res.xpAwarded).toBe(0);
  });

  it('reports the executor mock flag to the client', async () => {
    const { db } = fakeDb({ inserts: [[{ id: 's1' }]], selects: [[]] });
    const service = new SubmissionService(
      db as never,
      userClient() as never,
      challenges(),
      executor({ passed: 1, total: 1, allPassed: true, mock: true }),
      entitlements,
    );

    const res = await service.create('u1', 'c1', dto);
    expect(res.mock).toBe(true);
  });

  it('scores zero when the challenge has no test cases', async () => {
    const { db } = fakeDb({ inserts: [[{ id: 's1' }]] });
    const service = new SubmissionService(
      db as never,
      userClient() as never,
      challenges(),
      executor({ passed: 0, total: 0, allPassed: false }),
      entitlements,
    );

    const res = await service.create('u1', 'c1', dto);
    expect(res.score).toBe(0);
    expect(res.passed).toBe(false);
  });
});
