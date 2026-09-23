import { UserService } from './user.service';
import type { NotificationService } from './notification.service';

/** Leaderboard reads never raise notifications; a stub satisfies the ctor. */
const notifications = {
  create: jest.fn(),
} as unknown as NotificationService;

/**
 * Leaderboard assembly. The ranking itself is a SQL window function, so what is
 * pinned here is the code around it: the privacy-preserving display name, the
 * viewer row (on-page vs. looked up separately), and the admin exclusion.
 */

/** Ordered Drizzle stand-in: the Nth select resolves to the Nth queued rows. */
function fakeDb(selects: unknown[][]) {
  let si = 0;
  const db = {
    select: () => {
      const idx = si++;
      const node: Record<string, unknown> = {};
      for (const m of ['from', 'where', 'orderBy', 'limit']) node[m] = () => node;
      node.then = (res: (v: unknown) => unknown, rej: (r: unknown) => unknown) =>
        Promise.resolve(selects[idx] ?? []).then(res, rej);
      return node;
    },
  };
  return { db, selectCount: () => si };
}

const row = (over: Record<string, unknown> = {}) => ({
  rank: 1,
  userId: 'u1',
  firstName: 'Sok',
  lastName: 'Dara',
  avatar: 'rocket',
  xp: 2450,
  streak: 7,
  ...over,
});

describe('UserService.leaderboard', () => {
  it('ranks the page and marks the viewer', async () => {
    const ranked = [
      row({ rank: 1, userId: 'u1', xp: 2450 }),
      row({ rank: 2, userId: 'u2', firstName: 'Chan', lastName: 'Bopha', xp: 900 }),
    ];
    const { db } = fakeDb([ranked, [{ total: 2 }]]);
    const service = new UserService(db as never, notifications);

    const board = await service.leaderboard('u2', 20);

    expect(board.total).toBe(2);
    expect(board.entries).toHaveLength(2);
    expect(board.entries[0]).toMatchObject({ rank: 1, xp: 2450, isViewer: false });
    expect(board.entries[1]).toMatchObject({ rank: 2, isViewer: true });
  });

  it('shows a first name plus last initial, never a full surname or email', async () => {
    const { db } = fakeDb([[row()], [{ total: 1 }]]);
    const board = await new UserService(db as never, notifications).leaderboard('u1', 20);

    expect(board.entries[0].displayName).toBe('Sok D.');
    expect(JSON.stringify(board.entries[0])).not.toContain('Dara');
    expect(board.entries[0]).not.toHaveProperty('email');
  });

  it('falls back to a generic name when the learner has no name set', async () => {
    const { db } = fakeDb([
      [row({ firstName: null, lastName: null })],
      [{ total: 1 }],
    ]);
    const board = await new UserService(db as never, notifications).leaderboard('u1', 20);
    expect(board.entries[0].displayName).toBe('Learner');
  });

  it('uses the on-page row as "me" without a second lookup', async () => {
    const { db, selectCount } = fakeDb([[row({ userId: 'u1' })], [{ total: 1 }]]);
    const board = await new UserService(db as never, notifications).leaderboard('u1', 20);

    expect(board.me).toMatchObject({ userId: 'u1', isViewer: true });
    // ranked page + count only — no extra standing query.
    expect(selectCount()).toBe(2);
  });

  it('looks up the viewer separately when they rank below the page', async () => {
    const page = [row({ userId: 'other', firstName: 'Chan', lastName: 'Bopha' })];
    const viewer = [
      {
        userId: 'u1',
        firstName: 'Sok',
        lastName: 'Dara',
        avatar: 'star',
        xp: 10,
        streak: 1,
        isAdmin: false,
      },
    ];
    // page, count, viewer row, count-ahead
    const { db } = fakeDb([page, [{ total: 50 }], viewer, [{ count: 41 }]]);
    const board = await new UserService(db as never, notifications).leaderboard('u1', 1);

    expect(board.entries[0].isViewer).toBe(false);
    expect(board.me).toMatchObject({ userId: 'u1', rank: 42, xp: 10, isViewer: true });
  });

  it('returns a null "me" for an admin, who is not on the board', async () => {
    const page = [row({ userId: 'other' })];
    const admin = [{ userId: 'a1', firstName: 'Root', lastName: null, avatar: null, xp: 0, streak: 0, isAdmin: true }];
    const { db } = fakeDb([page, [{ total: 3 }], admin]);

    const board = await new UserService(db as never, notifications).leaderboard('a1', 20);
    expect(board.me).toBeNull();
  });

  it('returns a null "me" when the account no longer exists', async () => {
    const { db } = fakeDb([[row({ userId: 'other' })], [{ total: 1 }], []]);
    const board = await new UserService(db as never, notifications).leaderboard('ghost', 20);
    expect(board.me).toBeNull();
  });

  it('treats missing xp/streak as zero', async () => {
    const { db } = fakeDb([[row({ xp: null, streak: null })], [{ total: 1 }]]);
    const board = await new UserService(db as never, notifications).leaderboard('u1', 20);
    expect(board.entries[0]).toMatchObject({ xp: 0, streak: 0 });
  });

  it('reports an empty board rather than failing', async () => {
    const { db } = fakeDb([[], [{ total: 0 }], []]);
    const board = await new UserService(db as never, notifications).leaderboard('u1', 20);
    expect(board.entries).toEqual([]);
    expect(board.total).toBe(0);
  });
});
