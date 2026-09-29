import * as bcrypt from 'bcrypt';
import { EmailService } from '@app/common';
import { ACCOUNT_DELETION_GRACE_DAYS } from '@app/contracts';
import { AccountDeletionService } from './account-deletion.service';

/**
 * Requesting deletion: a password is required, the grace-period clock starts
 * once (asking again doesn't push the date back), every session is revoked,
 * and a confirmation email goes out without being load-bearing.
 */

const PASSWORD = 'correct-horse';
let passwordHash: string;
beforeAll(async () => {
  passwordHash = await bcrypt.hash(PASSWORD, 4);
});

function fakeDb(found: unknown) {
  const set = jest.fn<void, [Record<string, unknown>]>();
  return {
    set,
    db: {
      select: () => {
        const node: Record<string, unknown> = {};
        for (const m of ['from', 'where', 'limit']) node[m] = () => node;
        node.then = (
          res: (v: unknown) => unknown,
          rej: (r: unknown) => unknown,
        ) => Promise.resolve(found ? [found] : []).then(res, rej);
        return node;
      },
      update: () => ({
        set: (v: Record<string, unknown>) => {
          set(v);
          return { where: () => Promise.resolve(undefined) };
        },
      }),
    },
  };
}

const account = (over: Record<string, unknown> = {}) => ({
  id: 'u1',
  email: 'a@b.com',
  password: passwordHash,
  deletionRequestedAt: null,
  ...over,
});

const emailService = (ok = true) => {
  const sendAccountDeletionEmail = ok
    ? jest.fn().mockResolvedValue({})
    : jest.fn().mockRejectedValue(new Error('smtp down'));
  return {
    sendAccountDeletionEmail,
    service: { sendAccountDeletionEmail } as unknown as EmailService,
  };
};

describe('AccountDeletionService.request', () => {
  it('throws 404 for an unknown user', async () => {
    const { db } = fakeDb(null);
    const svc = new AccountDeletionService(db as never, emailService().service);
    await expect(
      svc.request({ userId: 'x', password: PASSWORD }),
    ).rejects.toMatchObject({ error: { statusCode: 404 } });
  });

  it('refuses a wrong password and changes nothing', async () => {
    const { db, set } = fakeDb(account());
    const email = emailService();
    const svc = new AccountDeletionService(db as never, email.service);
    await expect(
      svc.request({ userId: 'u1', password: 'nope' }),
    ).rejects.toMatchObject({ error: { statusCode: 401 } });
    expect(set).not.toHaveBeenCalled();
    expect(email.sendAccountDeletionEmail).not.toHaveBeenCalled();
  });

  it('starts the grace period, revokes sessions and emails the owner', async () => {
    const { db, set } = fakeDb(account());
    const email = emailService();
    const svc = new AccountDeletionService(db as never, email.service);
    const before = Date.now();

    const res = await svc.request({ userId: 'u1', password: PASSWORD });

    const changes = set.mock.calls[0][0];
    expect(changes.deletionRequestedAt).toBeInstanceOf(Date);
    expect(changes).toMatchObject({
      refreshToken: null,
      refreshTokenExpiresAt: null,
    });
    const graceMs = ACCOUNT_DELETION_GRACE_DAYS * 86_400_000;
    expect(res.deleteAfter.getTime()).toBeGreaterThanOrEqual(before + graceMs);
    expect(email.sendAccountDeletionEmail).toHaveBeenCalledWith(
      'a@b.com',
      res.deleteAfter,
    );
  });

  it('keeps the original date when asked again, without re-emailing', async () => {
    const requestedAt = new Date('2026-09-20T00:00:00Z');
    const { db, set } = fakeDb(account({ deletionRequestedAt: requestedAt }));
    const email = emailService();
    const svc = new AccountDeletionService(db as never, email.service);

    const res = await svc.request({ userId: 'u1', password: PASSWORD });

    expect(set.mock.calls[0][0].deletionRequestedAt).toBe(requestedAt);
    expect(res.deleteAfter.toISOString()).toBe('2026-09-27T00:00:00.000Z');
    expect(email.sendAccountDeletionEmail).not.toHaveBeenCalled();
  });

  it('still schedules the deletion when the email fails', async () => {
    const { db, set } = fakeDb(account());
    const svc = new AccountDeletionService(
      db as never,
      emailService(false).service,
    );
    await expect(
      svc.request({ userId: 'u1', password: PASSWORD }),
    ).resolves.toHaveProperty('deleteAfter');
    expect(set).toHaveBeenCalled();
  });
});
