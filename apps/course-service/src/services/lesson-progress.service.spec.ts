import { CourseEntitlementService } from '@app/common';
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
