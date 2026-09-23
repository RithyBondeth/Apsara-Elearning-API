import { NotificationService } from './notification.service';

/**
 * The notification feed. The security-relevant part is that every read and
 * write is scoped by userId as well as id, so a guessed id cannot touch another
 * learner's row — and that `unreadCount` reflects everything unread, not just
 * the returned page, because it drives the bell badge.
 */

function fakeDb(opts: {
  selects?: unknown[][];
  inserts?: unknown[][];
  updates?: unknown[][];
} = {}) {
  const selects = opts.selects ?? [];
  const inserts = opts.inserts ?? [];
  const updates = opts.updates ?? [];
  let si = 0;
  let ii = 0;
  let ui = 0;
  const whereArgs: unknown[] = [];
  const inserted: unknown[] = [];

  const readNode = (resolve: () => unknown) => {
    const node: Record<string, unknown> = {};
    for (const m of ['from', 'orderBy', 'limit']) node[m] = () => node;
    node.where = (arg: unknown) => {
      whereArgs.push(arg);
      return node;
    };
    node.then = (res: (v: unknown) => unknown, rej: (r: unknown) => unknown) =>
      Promise.resolve(resolve()).then(res, rej);
    return node;
  };

  const db = {
    select: () => readNode(() => selects[si++] ?? []),
    insert: () => ({
      values: (v: unknown) => {
        inserted.push(v);
        return { returning: () => Promise.resolve(inserts[ii++] ?? []) };
      },
    }),
    update: () => ({
      set: () => ({
        where: (arg: unknown) => {
          whereArgs.push(arg);
          return { returning: () => Promise.resolve(updates[ui++] ?? []) };
        },
      }),
    }),
  };
  return { db, inserted, whereArgs, selectCount: () => si };
}

const row = (over: Record<string, unknown> = {}) => ({
  id: 'n1',
  userId: 'u1',
  type: 'badge_awarded',
  title: 'Badge earned: First Steps',
  body: 'You crossed 100 XP.',
  data: { badgeId: 'b1' },
  readAt: null,
  createdAt: new Date('2026-09-23T09:00:00Z'),
  updatedAt: new Date('2026-09-23T09:00:00Z'),
  ...over,
});

describe('NotificationService.create', () => {
  it('stores the notification and returns it without the owner id', async () => {
    const { db, inserted } = fakeDb({ inserts: [[row()]] });
    const dto = {
      userId: 'u1',
      type: 'badge_awarded' as const,
      title: 'Badge earned: First Steps',
      body: 'You crossed 100 XP.',
      data: { badgeId: 'b1' },
    };

    const created = await new NotificationService(db as never).create(dto);

    expect(inserted[0]).toMatchObject({ userId: 'u1', type: 'badge_awarded' });
    expect(created).toMatchObject({ id: 'n1', type: 'badge_awarded' });
    // The caller already knows whose it is; don't echo it back.
    expect(created).not.toHaveProperty('userId');
  });

  it('normalises a missing body and data to null', async () => {
    const { db, inserted } = fakeDb({ inserts: [[row()]] });
    await new NotificationService(db as never).create({
      userId: 'u1',
      type: 'quiz_passed',
      title: 'Quiz passed',
    });
    expect(inserted[0]).toMatchObject({ body: null, data: null });
  });
});

describe('NotificationService.findByUser', () => {
  it('returns the page plus the full unread count', async () => {
    // page, then the unread count
    const { db } = fakeDb({ selects: [[row(), row({ id: 'n2' })], [{ count: 7 }]] });

    const list = await new NotificationService(db as never).findByUser(
      'u1',
      20,
      false,
    );

    expect(list.items).toHaveLength(2);
    // Counted separately — the badge must not be capped by the page size.
    expect(list.unreadCount).toBe(7);
  });

  it('reports zero unread on an empty feed', async () => {
    const { db } = fakeDb({ selects: [[], []] });
    const list = await new NotificationService(db as never).findByUser('u1', 20, false);
    expect(list.items).toEqual([]);
    expect(list.unreadCount).toBe(0);
  });

  it('applies a different filter when unreadOnly is set', async () => {
    const unread = fakeDb({ selects: [[row()], [{ count: 1 }]] });
    await new NotificationService(unread.db as never).findByUser('u1', 20, true);

    const all = fakeDb({ selects: [[row()], [{ count: 1 }]] });
    await new NotificationService(all.db as never).findByUser('u1', 20, false);

    // The feed query's predicate differs between the two modes.
    expect(unread.whereArgs[0]).not.toEqual(all.whereArgs[0]);
  });
});

describe('NotificationService.markRead', () => {
  it('marks an unread notification and returns the new count', async () => {
    const { db } = fakeDb({ updates: [[{ id: 'n1' }]], selects: [[{ count: 2 }]] });

    const result = await new NotificationService(db as never).markRead('u1', 'n1');

    expect(result).toMatchObject({ updated: 1, unreadCount: 2 });
  });

  it('is a no-op for an already-read notification the learner owns', async () => {
    // update matched nothing, but the row exists and is theirs
    const { db } = fakeDb({
      updates: [[]],
      selects: [[{ id: 'n1' }], [{ count: 0 }]],
    });

    const result = await new NotificationService(db as never).markRead('u1', 'n1');

    expect(result.updated).toBe(0);
    expect(result.unreadCount).toBe(0);
  });

  it('throws 404 for a notification that is not the learner’s', async () => {
    // update matched nothing and the ownership check finds nothing either
    const { db } = fakeDb({ updates: [[]], selects: [[]] });

    await expect(
      new NotificationService(db as never).markRead('u1', 'someone-elses'),
    ).rejects.toMatchObject({ error: { statusCode: 404 } });
  });
});

describe('NotificationService.markAllRead', () => {
  it('reports how many were cleared and drops the count to zero', async () => {
    const { db } = fakeDb({ updates: [[{ id: 'n1' }, { id: 'n2' }, { id: 'n3' }]] });

    const result = await new NotificationService(db as never).markAllRead('u1');

    expect(result).toEqual({ updated: 3, unreadCount: 0 });
  });

  it('is harmless when nothing is unread', async () => {
    const { db } = fakeDb({ updates: [[]] });
    const result = await new NotificationService(db as never).markAllRead('u1');
    expect(result).toEqual({ updated: 0, unreadCount: 0 });
  });
});
