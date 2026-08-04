import { CourseService } from './course.service';
import type { CourseEntitlementService } from '@app/common';

/**
 * Minimal Drizzle stand-in: every builder method returns the same node and the
 * node resolves to the next queued result set. Counting `select()` calls is how
 * these tests pin the N+1 collapse — the point of the endpoint is that the
 * query count does not grow with the size of the course.
 */
function fakeDb(results: unknown[][]) {
  let selects = 0;
  const db = {
    select: () => {
      const index = selects++;
      const node: Record<string, unknown> = {};
      for (const method of [
        'from',
        'leftJoin',
        'innerJoin',
        'where',
        'orderBy',
        'groupBy',
        'limit',
        'offset',
      ]) {
        node[method] = () => node;
      }
      node.then = (
        resolve: (value: unknown) => unknown,
        reject: (reason: unknown) => unknown,
      ) => Promise.resolve(results[index] ?? []).then(resolve, reject);
      return node;
    },
  };
  return { db, queryCount: () => selects };
}

const entitlements = (canRead: boolean) =>
  ({
    canReadCourseContent: jest.fn().mockResolvedValue(canRead),
  }) as unknown as CourseEntitlementService;

const moduleRow = (id: string, order: number) => ({
  id,
  courseId: 'course-1',
  title: `Module ${order}`,
  order,
});

const lessonRow = (id: string, moduleId: string, order: number) => ({
  id,
  moduleId,
  title: `Lesson ${order}`,
  slug: `lesson-${order}`,
  content: 'body',
  videoUrl: 'https://video',
  order,
});

describe('CourseService.findStructure', () => {
  const modules = [moduleRow('m1', 0), moduleRow('m2', 1)];
  const lessons = [
    lessonRow('l1', 'm1', 0),
    lessonRow('l2', 'm1', 1),
    lessonRow('l3', 'm2', 0),
  ];

  it('nests lessons under their module', async () => {
    const { db } = fakeDb([modules, lessons]);
    const service = new CourseService(db as never, entitlements(true));

    const structure = await service.findStructure('course-1');

    expect(structure.map((m) => m.id)).toEqual(['m1', 'm2']);
    expect(structure[0].lessons.map((l) => l.id)).toEqual(['l1', 'l2']);
    expect(structure[1].lessons.map((l) => l.id)).toEqual(['l3']);
  });

  it('reads the whole outline in a fixed number of queries', async () => {
    const many = Array.from({ length: 25 }, (_, i) => moduleRow(`m${i}`, i));
    const { db, queryCount } = fakeDb([many, lessons]);
    const service = new CourseService(db as never, entitlements(true));

    await service.findStructure('course-1');

    // Two: modules, then all their lessons at once. The old client-side walk
    // was 1 + one per module — 26 round-trips for this course.
    expect(queryCount()).toBe(2);
  });

  it('returns unlocked lessons with their content when entitled', async () => {
    const { db } = fakeDb([modules, lessons]);
    const service = new CourseService(db as never, entitlements(true));

    const [first] = await service.findStructure('course-1', 'user-1');

    expect(first.lessons[0].locked).toBe(false);
    expect(first.lessons[0].content).toBe('body');
  });

  it('strips premium bodies but still lists the lessons as locked', async () => {
    const { db } = fakeDb([modules, lessons]);
    const service = new CourseService(db as never, entitlements(false));

    const structure = await service.findStructure('course-1', 'user-1');

    expect(structure.flatMap((m) => m.lessons)).toHaveLength(3);
    for (const lesson of structure.flatMap((m) => m.lessons)) {
      expect(lesson.locked).toBe(true);
      expect(lesson.content).toBeUndefined();
      expect(lesson.videoUrl).toBeUndefined();
    }
  });

  it('skips the lesson query entirely for an empty course', async () => {
    const { db, queryCount } = fakeDb([[]]);
    const service = new CourseService(db as never, entitlements(true));

    await expect(service.findStructure('course-1')).resolves.toEqual([]);
    expect(queryCount()).toBe(1);
  });

  it('propagates the entitlement check (unpublished courses throw)', async () => {
    const { db } = fakeDb([modules, lessons]);
    const failing = {
      canReadCourseContent: jest.fn().mockRejectedValue(new Error('not found')),
    } as unknown as CourseEntitlementService;
    const service = new CourseService(db as never, failing);

    await expect(service.findStructure('course-1')).rejects.toThrow(
      'not found',
    );
  });
});

describe('CourseService catalog counts', () => {
  const courseRows = [
    { id: 'course-1', slug: 'math', published: true },
    { id: 'course-2', slug: 'physics', published: true },
  ];

  it('attaches module and lesson totals to every published course', async () => {
    const { db } = fakeDb([
      courseRows,
      [
        { courseId: 'course-1', moduleCount: 6, lessonCount: 42 },
        { courseId: 'course-2', moduleCount: 3, lessonCount: 11 },
      ],
    ]);
    const service = new CourseService(db as never, entitlements(true));

    const [math, physics] = await service.findPublished();

    expect(math.moduleCount).toBe(6);
    expect(math.lessonCount).toBe(42);
    expect(physics.moduleCount).toBe(3);
    expect(physics.lessonCount).toBe(11);
  });

  it('costs one extra query no matter how many courses are listed', async () => {
    const many = Array.from({ length: 40 }, (_, i) => ({
      id: `course-${i}`,
      slug: `c${i}`,
      published: true,
    }));
    const { db, queryCount } = fakeDb([many, []]);
    const service = new CourseService(db as never, entitlements(true));

    await service.findPublished();

    // Courses + one grouped aggregate. The catalog previously issued
    // 1 + modules requests per course on top of this.
    expect(queryCount()).toBe(2);
  });

  it('reports zero for a course that has no modules yet', async () => {
    const { db } = fakeDb([courseRows, []]);
    const service = new CourseService(db as never, entitlements(true));

    const [math] = await service.findPublished();

    expect(math.moduleCount).toBe(0);
    expect(math.lessonCount).toBe(0);
  });

  it('does not run the aggregate when nothing is published', async () => {
    const { db, queryCount } = fakeDb([[]]);
    const service = new CourseService(db as never, entitlements(true));

    await expect(service.findPublished()).resolves.toEqual([]);
    expect(queryCount()).toBe(1);
  });
});
