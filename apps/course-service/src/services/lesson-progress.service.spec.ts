import { CourseEntitlementService } from '@app/common';
import { of } from 'rxjs';
import { LessonProgressService } from './lesson-progress.service';
import type { CertificateService } from './certificate.service';

/**
 * Enrollment progress recomputation: percent is round(completed/total*100),
 * a course is complete only when every lesson is done, and a missing
 * enrollment is a clean 404. Also the "not started" default from findByLesson.
 */

/** Ordered Drizzle stand-in that also captures each update's set payload. */
function fakeDb(opts: { selects?: unknown[][]; updates?: unknown[][] } = {}) {
  const selects = opts.selects ?? [];
  const updates = opts.updates ?? [];
  let si = 0;
  let ui = 0;
  const updateSet: Record<string, unknown>[] = [];
  const db = {
    select: () => {
      const idx = si++;
      const node: Record<string, unknown> = {};
      for (const m of ['from', 'leftJoin', 'innerJoin', 'where', 'orderBy', 'limit']) {
        node[m] = () => node;
      }
      node.then = (res: (v: unknown) => unknown, rej: (r: unknown) => unknown) =>
        Promise.resolve(selects[idx] ?? []).then(res, rej);
      return node;
    },
    update: () => ({
      set: (v: Record<string, unknown>) => {
        updateSet.push(v);
        return { where: () => ({ returning: () => Promise.resolve(updates[ui++] ?? []) }) };
      },
    }),
  };
  return { db, updateSet };
}

const entitlements = {} as unknown as CourseEntitlementService;
const certificates = {} as unknown as CertificateService;
const userClient = { send: jest.fn() };

function service(db: unknown) {
  return new LessonProgressService(
    db as never,
    userClient as never,
    entitlements,
    certificates,
  );
}

const lessonIds = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `l${i}` }));

describe('LessonProgressService.recalculate', () => {
  it('computes a partial percentage and leaves the course incomplete', async () => {
    const { db, updateSet } = fakeDb({
      selects: [lessonIds(4), [{ id: 'p1' }, { id: 'p2' }]], // 4 lessons, 2 completed
      updates: [[{ id: 'e1', progressPercent: 50, completed: false }]],
    });

    await service(db).recalculate('u1', 'c1');

    expect(updateSet[0].progressPercent).toBe(50);
    expect(updateSet[0].completed).toBe(false);
    expect(updateSet[0].completedAt).toBeNull();
  });

  it('marks the course complete and stamps completedAt when every lesson is done', async () => {
    const { db, updateSet } = fakeDb({
      selects: [lessonIds(2), [{ id: 'p1' }, { id: 'p2' }]],
      updates: [[{ id: 'e1', progressPercent: 100, completed: true }]],
    });

    await service(db).recalculate('u1', 'c1');

    expect(updateSet[0].progressPercent).toBe(100);
    expect(updateSet[0].completed).toBe(true);
    expect(updateSet[0].completedAt).toBeInstanceOf(Date);
  });

  it('treats a course with no lessons as 0% and not complete', async () => {
    // total === 0 must not divide-by-zero or count as "all lessons done".
    const { db, updateSet } = fakeDb({
      selects: [[]],
      updates: [[{ id: 'e1', progressPercent: 0, completed: false }]],
    });

    await service(db).recalculate('u1', 'c1');

    expect(updateSet[0].progressPercent).toBe(0);
    expect(updateSet[0].completed).toBe(false);
  });

  it('rounds the percentage to the nearest whole number', async () => {
    // 1 of 3 -> 33.33 -> 33
    const { db, updateSet } = fakeDb({
      selects: [lessonIds(3), [{ id: 'p1' }]],
      updates: [[{ id: 'e1' }]],
    });

    await service(db).recalculate('u1', 'c1');

    expect(updateSet[0].progressPercent).toBe(33);
  });

  it('throws 404 when the enrollment does not exist', async () => {
    const { db } = fakeDb({ selects: [lessonIds(2), [{ id: 'p1' }]], updates: [[]] });
    await expect(service(db).recalculate('u1', 'c1')).rejects.toMatchObject({
      error: { statusCode: 404 },
    });
  });
});

describe('LessonProgressService.findByLesson', () => {
  it('returns the stored progress row when present', async () => {
    const { db } = fakeDb({ selects: [[{ userId: 'u1', lessonId: 'l1', completed: true }]] });
    const dto = await service(db).findByLesson('u1', 'l1');
    expect(dto.completed).toBe(true);
  });

  it('defaults to not-completed when the learner has no row yet', async () => {
    const { db } = fakeDb({ selects: [[]] });
    const dto = await service(db).findByLesson('u1', 'l1');
    expect(dto).toMatchObject({ userId: 'u1', lessonId: 'l1', completed: false });
  });
});

/** Chainable read node resolving to `resolve()` at await time. */
function readNode(resolve: () => unknown) {
  const node: Record<string, unknown> = {};
  for (const m of ['from', 'leftJoin', 'innerJoin', 'where', 'orderBy', 'limit']) node[m] = () => node;
  node.then = (res: (v: unknown) => unknown, rej: (r: unknown) => unknown) =>
    Promise.resolve(resolve()).then(res, rej);
  return node;
}

/**
 * Fuller db for the markComplete orchestration. Select order:
 * courseIdForLesson, ensureEnrolled, isCompleted, recalc lessons, recalc
 * completed. selectDistinct backs the best-effort streak sync.
 */
function markCompleteDb(opts: {
  courseRow?: unknown[];
  enrollment?: unknown[];
  alreadyDone?: unknown[];
  recalcLessons?: unknown[];
  recalcCompleted?: unknown[];
  updated?: unknown[];
}) {
  const queue = [
    opts.courseRow ?? [{ courseId: 'c1' }],
    opts.enrollment ?? [{ userId: 'u1', courseId: 'c1', completed: false }],
    opts.alreadyDone ?? [],
    opts.recalcLessons ?? [{ id: 'l1' }],
    opts.recalcCompleted ?? [{ id: 'p1' }],
  ];
  let si = 0;
  return {
    select: () => readNode(() => queue[si++] ?? []),
    selectDistinct: () => readNode(() => []),
    insert: () => ({ values: () => ({ onConflictDoUpdate: () => Promise.resolve(undefined) }) }),
    update: () => ({
      set: () => ({
        where: () => ({ returning: () => Promise.resolve(opts.updated ?? [{ id: 'e1', completed: false }]) }),
      }),
    }),
  };
}

describe('LessonProgressService.markComplete', () => {
  function build(db: unknown) {
    const certs = {
      issue: jest.fn().mockResolvedValue({ code: 'APS-4K7M-QW2X-9BTF' }),
    };
    const uc = { send: jest.fn().mockReturnValue(of({})) };
    const ents = { assertCanEnroll: jest.fn().mockResolvedValue(undefined) };
    const svc = new LessonProgressService(
      db as never,
      uc as never,
      ents as unknown as CourseEntitlementService,
      certs as unknown as CertificateService,
    );
    /** Notification types raised through the user-service client. */
    const raised = () =>
      uc.send.mock.calls
        .filter(([pattern]) => pattern === 'user.notification.create')
        .map(([, payload]) => (payload as { type: string }).type);

    return { svc, certs, uc, raised };
  }

  it('throws 404 when the lesson has no course', async () => {
    const { svc } = build(markCompleteDb({ courseRow: [] }));
    await expect(svc.markComplete('u1', 'l1')).rejects.toMatchObject({ error: { statusCode: 404 } });
  });

  it('throws 400 when the learner is not enrolled', async () => {
    const { svc } = build(markCompleteDb({ enrollment: [] }));
    await expect(svc.markComplete('u1', 'l1')).rejects.toMatchObject({ error: { statusCode: 400 } });
  });

  it('awards lesson XP the first time and returns the lesson completed', async () => {
    const { svc } = build(markCompleteDb({ alreadyDone: [] }));
    const res = await svc.markComplete('u1', 'l1');
    expect(res.completed).toBe(true);
    expect(res.xpAwarded).toBe(10);
  });

  it('does not re-award XP when the lesson was already completed', async () => {
    const { svc } = build(markCompleteDb({ alreadyDone: [{ completed: true }] }));
    const res = await svc.markComplete('u1', 'l1');
    expect(res.xpAwarded).toBe(0);
  });

  it('issues the certificate when this completion finishes the course', async () => {
    const { svc, certs } = build(markCompleteDb({ updated: [{ id: 'e1', completed: true }] }));
    await svc.markComplete('u1', 'l1');
    expect(certs.issue).toHaveBeenCalledWith('u1', 'c1');
  });

  it('does not issue a certificate while the course is unfinished', async () => {
    const { svc, certs } = build(markCompleteDb({ updated: [{ id: 'e1', completed: false }] }));
    await svc.markComplete('u1', 'l1');
    expect(certs.issue).not.toHaveBeenCalled();
  });

  it('announces course completion when this lesson finishes the course', async () => {
    const { svc, raised } = build(
      markCompleteDb({ updated: [{ id: 'e1', completed: true }] }),
    );
    await svc.markComplete('u1', 'l1');
    expect(raised()).toEqual(
      expect.arrayContaining(['course_completed', 'certificate_issued']),
    );
  });

  it('does not announce completion again for an already-finished course', async () => {
    // Re-marking a lesson in a finished course must not re-notify.
    const { svc, raised } = build(
      markCompleteDb({
        enrollment: [{ userId: 'u1', courseId: 'c1', completed: true }],
        updated: [{ id: 'e1', completed: true }],
      }),
    );
    await svc.markComplete('u1', 'l1');
    expect(raised()).not.toContain('course_completed');
    expect(raised()).not.toContain('certificate_issued');
  });

  it('announces nothing while the course is unfinished', async () => {
    const { svc, raised } = build(
      markCompleteDb({ updated: [{ id: 'e1', completed: false }] }),
    );
    await svc.markComplete('u1', 'l1');
    expect(raised()).toEqual([]);
  });

  it('still completes the lesson when certificate issuance throws', async () => {
    const db = markCompleteDb({ updated: [{ id: 'e1', completed: true }] });
    const certs = { issue: jest.fn().mockRejectedValue(new Error('no entitlement')) };
    const uc = { send: jest.fn().mockReturnValue(of({})) };
    const ents = { assertCanEnroll: jest.fn().mockResolvedValue(undefined) };
    const svc = new LessonProgressService(
      db as never,
      uc as never,
      ents as unknown as CourseEntitlementService,
      certs as unknown as CertificateService,
    );
    const res = await svc.markComplete('u1', 'l1');
    expect(res.completed).toBe(true);
  });
});
