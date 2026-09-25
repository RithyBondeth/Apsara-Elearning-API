import { RatingService } from './rating.service';

/**
 * Course ratings. The things worth pinning: only enrolled learners can rate,
 * an unrated course reports a null average rather than zero, and reviewer
 * names are reduced to a first name plus last initial.
 */

function fakeDb(
  opts: {
    selects?: unknown[][];
    inserts?: unknown[][];
    deletes?: unknown[][];
  } = {},
) {
  const selects = opts.selects ?? [];
  const inserts = opts.inserts ?? [];
  const deletes = opts.deletes ?? [];
  let si = 0;
  let ii = 0;
  let di = 0;
  const inserted: unknown[] = [];

  const readNode = (resolve: () => unknown) => {
    const node: Record<string, unknown> = {};
    for (const m of [
      'from',
      'innerJoin',
      'where',
      'orderBy',
      'groupBy',
      'limit',
    ]) {
      node[m] = () => node;
    }
    node.then = (res: (v: unknown) => unknown, rej: (r: unknown) => unknown) =>
      Promise.resolve(resolve()).then(res, rej);
    return node;
  };

  const db = {
    select: () => readNode(() => selects[si++] ?? []),
    insert: () => ({
      values: (v: unknown) => {
        inserted.push(v);
        return {
          onConflictDoUpdate: () => ({
            returning: () => Promise.resolve(inserts[ii++] ?? []),
          }),
        };
      },
    }),
    delete: () => ({
      where: () => ({ returning: () => Promise.resolve(deletes[di++] ?? []) }),
    }),
  };
  return { db, inserted };
}

const savedRow = (over: Record<string, unknown> = {}) => ({
  id: 'r1',
  userId: 'u1',
  courseId: 'c1',
  rating: 5,
  review: 'Clear explanations.',
  createdAt: new Date('2026-09-24T09:00:00Z'),
  updatedAt: new Date('2026-09-24T09:00:00Z'),
  ...over,
});

describe('RatingService.upsert', () => {
  it('refuses a learner who is not enrolled', async () => {
    const { db, inserted } = fakeDb({ selects: [[]] }); // no enrollment
    await expect(
      new RatingService(db as never).upsert('u1', 'c1', { rating: 5 }),
    ).rejects.toMatchObject({ error: { statusCode: 403 } });
    expect(inserted).toHaveLength(0);
  });

  it('saves a rating for an enrolled learner', async () => {
    const { db, inserted } = fakeDb({
      selects: [[{ id: 'e1' }]],
      inserts: [[savedRow()]],
    });

    const saved = await new RatingService(db as never).upsert('u1', 'c1', {
      rating: 5,
      review: 'Clear explanations.',
    });

    expect(inserted[0]).toMatchObject({
      userId: 'u1',
      courseId: 'c1',
      rating: 5,
    });
    expect(saved).toMatchObject({ id: 'r1', rating: 5 });
  });

  it('stores a blank review as null rather than empty text', async () => {
    const { db, inserted } = fakeDb({
      selects: [[{ id: 'e1' }]],
      inserts: [[savedRow({ review: null })]],
    });

    await new RatingService(db as never).upsert('u1', 'c1', {
      rating: 4,
      review: '   ',
    });

    expect((inserted[0] as { review: unknown }).review).toBeNull();
  });

  it('trims a written review', async () => {
    const { db, inserted } = fakeDb({
      selects: [[{ id: 'e1' }]],
      inserts: [[savedRow()]],
    });

    await new RatingService(db as never).upsert('u1', 'c1', {
      rating: 4,
      review: '  good  ',
    });

    expect((inserted[0] as { review: unknown }).review).toBe('good');
  });
});

describe('RatingService.findByCourse', () => {
  it('reports a null average for an unrated course, never zero', async () => {
    // No rating buckets, no reviews.
    const { db } = fakeDb({ selects: [[], []] });

    const summary = await new RatingService(db as never).findByCourse('c1', 10);

    // A zero here would render an unrated course as a zero-star one.
    expect(summary.average).toBeNull();
    expect(summary.count).toBe(0);
    expect(summary.distribution).toEqual({
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
    });
  });

  it('averages the buckets and fills the distribution', async () => {
    const buckets = [
      { rating: 5, count: 3 },
      { rating: 4, count: 1 },
    ];
    const { db } = fakeDb({ selects: [buckets, []] });

    const summary = await new RatingService(db as never).findByCourse('c1', 10);

    // (5*3 + 4*1) / 4 = 4.75 -> 4.8
    expect(summary.average).toBe(4.8);
    expect(summary.count).toBe(4);
    expect(summary.distribution).toMatchObject({ '5': 3, '4': 1, '3': 0 });
  });

  it('rounds the average to one decimal place', async () => {
    const { db } = fakeDb({
      selects: [
        [
          { rating: 5, count: 1 },
          { rating: 4, count: 2 },
        ],
        [],
      ],
    });
    const summary = await new RatingService(db as never).findByCourse('c1', 10);
    // 13/3 = 4.333... -> 4.3
    expect(summary.average).toBe(4.3);
  });

  it('shows a first name plus last initial, never a surname or email', async () => {
    const reviews = [
      {
        id: 'r1',
        rating: 5,
        review: 'Great course.',
        createdAt: new Date(),
        firstName: 'Sok',
        lastName: 'Dara',
        avatar: 'rocket',
      },
    ];
    const { db } = fakeDb({ selects: [[{ rating: 5, count: 1 }], reviews] });

    const summary = await new RatingService(db as never).findByCourse('c1', 10);

    expect(summary.items[0].displayName).toBe('Sok D.');
    expect(JSON.stringify(summary.items[0])).not.toContain('Dara');
    expect(summary.items[0]).not.toHaveProperty('email');
  });

  it('falls back to a generic name for a learner with no name set', async () => {
    const reviews = [
      {
        id: 'r1',
        rating: 4,
        review: 'Good.',
        createdAt: new Date(),
        firstName: null,
        lastName: null,
        avatar: null,
      },
    ];
    const { db } = fakeDb({ selects: [[{ rating: 4, count: 1 }], reviews] });
    const summary = await new RatingService(db as never).findByCourse('c1', 10);
    expect(summary.items[0].displayName).toBe('Learner');
  });
});

describe('RatingService.findMine', () => {
  it('returns null when the learner has not rated', async () => {
    const { db } = fakeDb({ selects: [[]] });
    await expect(
      new RatingService(db as never).findMine('u1', 'c1'),
    ).resolves.toBeNull();
  });

  it('returns the learner’s own rating', async () => {
    const { db } = fakeDb({ selects: [[savedRow({ rating: 3 })]] });
    const mine = await new RatingService(db as never).findMine('u1', 'c1');
    expect(mine).toMatchObject({ id: 'r1', rating: 3 });
  });
});

describe('RatingService.remove', () => {
  it('removes the learner’s rating', async () => {
    const { db } = fakeDb({ deletes: [[{ id: 'r1' }]] });
    const result = await new RatingService(db as never).remove('u1', 'c1');
    expect(result).toMatchObject({ id: 'r1' });
  });

  it('throws 404 when there is nothing to remove', async () => {
    const { db } = fakeDb({ deletes: [[]] });
    await expect(
      new RatingService(db as never).remove('u1', 'c1'),
    ).rejects.toMatchObject({ error: { statusCode: 404 } });
  });
});

/**
 * Featured reviews. A second stand-in because these methods also call
 * `update().set()`: every select/update chain resolves to the next queued
 * result set, in call order.
 */
function featureDb(results: unknown[][]) {
  let calls = 0;
  const updates: unknown[] = [];
  const chain = () => {
    const index = calls++;
    const node: Record<string, unknown> = {};
    for (const method of [
      'from',
      'innerJoin',
      'leftJoin',
      'where',
      'orderBy',
      'groupBy',
      'limit',
    ]) {
      node[method] = () => node;
    }
    node.set = (values: unknown) => {
      updates.push(values);
      return node;
    };
    node.then = (
      resolve: (v: unknown) => unknown,
      reject: (r: unknown) => unknown,
    ) => Promise.resolve(results[index] ?? []).then(resolve, reject);
    return node;
  };
  return { db: { select: chain, update: chain }, updates };
}

const featuredRow = (id: string, rating: number) => ({
  id,
  rating,
  review: `Review ${id}`,
  createdAt: new Date('2026-09-01'),
  firstName: 'Sokha',
  lastName: 'Pich',
  avatar: 'rocket',
  courseTitle: 'Grade 12 Chemistry',
  courseTitleKm: 'គីមីវិទ្យា ថ្នាក់ទី១២',
  courseSlug: 'chemistry',
});

const adminRow = (featured: boolean) => ({
  id: 'r1',
  rating: 5,
  review: 'Great',
  featured,
  createdAt: new Date(),
  updatedAt: new Date(),
  firstName: 'Dara',
  lastName: 'Chan',
  avatar: null,
  email: 'dara@example.com',
  courseTitle: 'Biology',
});

describe('RatingService.findFeatured', () => {
  it('returns featured reviews with the overall average and count', async () => {
    const { db } = featureDb([
      [{ count: 12, average: 4.66666 }],
      [featuredRow('a', 5), featuredRow('b', 4)],
    ]);
    const service = new RatingService(db as never);

    const result = await service.findFeatured(6);

    expect(result.count).toBe(12);
    expect(result.average).toBe(4.7);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      displayName: 'Sokha P.',
      courseTitle: 'Grade 12 Chemistry',
      courseSlug: 'chemistry',
      rating: 5,
    });
  });

  it('never exposes an email or surname on the public payload', async () => {
    const { db } = featureDb([
      [{ count: 1, average: 5 }],
      [featuredRow('a', 5)],
    ]);
    const service = new RatingService(db as never);

    const [item] = (await service.findFeatured(6)).items;

    expect(JSON.stringify(item)).not.toContain('Pich');
    expect(item).not.toHaveProperty('email');
  });

  it('reports a null average, not zero, when nothing is rated', async () => {
    const { db } = featureDb([[{ count: 0, average: null }], []]);
    const service = new RatingService(db as never);

    await expect(service.findFeatured(6)).resolves.toMatchObject({
      average: null,
      count: 0,
      items: [],
    });
  });
});

describe('RatingService.setFeatured', () => {
  it('features a written review and returns its admin view', async () => {
    const { db, updates } = featureDb([
      [{ review: 'Great' }],
      [],
      [adminRow(true)],
    ]);
    const service = new RatingService(db as never);

    const result = await service.setFeatured('r1', true);

    expect(updates).toEqual([{ featured: true }]);
    expect(result).toMatchObject({ featured: true, displayName: 'Dara C.' });
  });

  it('refuses to feature a rating that has no written review', async () => {
    const { db, updates } = featureDb([[{ review: null }]]);
    const service = new RatingService(db as never);

    await expect(service.setFeatured('r1', true)).rejects.toThrow(
      'Only written reviews can be featured',
    );
    expect(updates).toEqual([]);
  });

  it('throws when the review does not exist', async () => {
    const { db } = featureDb([[]]);
    const service = new RatingService(db as never);

    await expect(service.setFeatured('missing', false)).rejects.toThrow(
      'Review not found',
    );
  });
});
