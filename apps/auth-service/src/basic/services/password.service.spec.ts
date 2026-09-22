import { EmailService, hashToken, JwtService } from '@app/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PasswordService } from './password.service';

/**
 * Password flows carry two security-sensitive promises: forgot-password must
 * not leak whether an account exists, and reset/change must reject stale or
 * wrong credentials while invalidating existing sessions on success.
 */

const RESET_TOKEN = 'reset-token';
const SALT = 4; // low cost keeps bcrypt fast in tests

function config() {
  return {
    get: (key: string) => (key === 'bcrypt.salt' ? SALT : '1h'),
  } as unknown as ConfigService;
}

function email(overrides: Record<string, jest.Mock> = {}) {
  return {
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as EmailService;
}

function jwt(overrides: Record<string, jest.Mock> = {}) {
  return {
    generatePasswordResetToken: jest.fn().mockResolvedValue(RESET_TOKEN),
    verifyPasswordResetToken: jest.fn().mockResolvedValue({ email: 'a@b.com', type: 'reset' }),
    ...overrides,
  } as unknown as JwtService;
}

/** Drizzle stand-in: a select that resolves to `selectRows`, an update that captures its payload. */
function fakeDb(selectRows: unknown[]) {
  const setSpy = jest.fn();
  const db = {
    select: () => {
      const node: Record<string, unknown> = {};
      for (const m of ['from', 'where', 'limit']) node[m] = () => node;
      node.then = (res: (v: unknown) => unknown) => Promise.resolve(selectRows).then(res);
      return node;
    },
    update: () => ({
      set: (v: unknown) => {
        setSpy(v);
        return { where: () => Promise.resolve(undefined) };
      },
    }),
  };
  return { db, setSpy };
}

describe('PasswordService.forgotPassword', () => {
  const generic = /if the account exists/i;

  it('returns the generic response and sends mail when the account exists', async () => {
    const { db } = fakeDb([{ id: 'u1', email: 'a@b.com' }]);
    const mailer = email();
    const service = new PasswordService(db as never, jwt(), mailer, config());

    const result = await service.forgotPassword({ email: 'a@b.com' } as never);

    expect(result.message).toMatch(generic);
    expect(mailer.sendPasswordResetEmail).toHaveBeenCalledWith('a@b.com', RESET_TOKEN);
  });

  it('returns the same generic response and sends nothing for an unknown account', async () => {
    const { db } = fakeDb([]);
    const mailer = email();
    const service = new PasswordService(db as never, jwt(), mailer, config());

    const result = await service.forgotPassword({ email: 'ghost@b.com' } as never);

    expect(result.message).toMatch(generic);
    expect(mailer.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('still returns the generic response when the email provider fails', async () => {
    // A provider outage must not become an account-existence oracle.
    const { db } = fakeDb([{ id: 'u1', email: 'a@b.com' }]);
    const mailer = email({
      sendPasswordResetEmail: jest.fn().mockRejectedValue(new Error('smtp down')),
    });
    const service = new PasswordService(db as never, jwt(), mailer, config());

    await expect(
      service.forgotPassword({ email: 'a@b.com' } as never),
    ).resolves.toMatchObject({ message: expect.stringMatching(generic) });
  });
});

describe('PasswordService.resetPassword', () => {
  function storedUser(overrides: Record<string, unknown> = {}) {
    return {
      id: 'u1',
      email: 'a@b.com',
      resetPasswordToken: hashToken(RESET_TOKEN),
      resetPasswordTokenExpiresAt: new Date(Date.now() + 60_000),
      ...overrides,
    };
  }

  it('sets a new hash and clears reset + session tokens on success', async () => {
    const { db, setSpy } = fakeDb([storedUser()]);
    const service = new PasswordService(db as never, jwt(), email(), config());

    const result = await service.resetPassword({
      token: RESET_TOKEN,
      newPassword: 'brand-new-pass1',
    } as never);

    expect(result.message).toMatch(/reset successfully/i);
    const payload = setSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.resetPasswordToken).toBeNull();
    expect(payload.refreshToken).toBeNull();
    expect(await bcrypt.compare('brand-new-pass1', payload.password as string)).toBe(true);
  });

  it('rejects a token that fails signature verification (400)', async () => {
    const { db } = fakeDb([storedUser()]);
    const service = new PasswordService(
      db as never,
      jwt({ verifyPasswordResetToken: jest.fn().mockRejectedValue(new Error('bad')) }),
      email(),
      config(),
    );
    await expect(
      service.resetPassword({ token: 'x', newPassword: 'brand-new-pass1' } as never),
    ).rejects.toMatchObject({ error: { statusCode: 400 } });
  });

  it('rejects when the stored token digest does not match', async () => {
    const { db } = fakeDb([storedUser({ resetPasswordToken: hashToken('different') })]);
    const service = new PasswordService(db as never, jwt(), email(), config());
    await expect(
      service.resetPassword({ token: RESET_TOKEN, newPassword: 'brand-new-pass1' } as never),
    ).rejects.toMatchObject({ error: { statusCode: 400 } });
  });

  it('rejects an expired reset token', async () => {
    const { db } = fakeDb([storedUser({ resetPasswordTokenExpiresAt: new Date(Date.now() - 1) })]);
    const service = new PasswordService(db as never, jwt(), email(), config());
    await expect(
      service.resetPassword({ token: RESET_TOKEN, newPassword: 'brand-new-pass1' } as never),
    ).rejects.toMatchObject({ error: { statusCode: 400 } });
  });
});

describe('PasswordService.changePassword', () => {
  async function userWithPassword(plain: string) {
    return { id: 'u1', email: 'a@b.com', password: await bcrypt.hash(plain, SALT) };
  }

  it('rejects when the user does not exist (404)', async () => {
    const { db } = fakeDb([]);
    const service = new PasswordService(db as never, jwt(), email(), config());
    await expect(
      service.changePassword({
        userId: 'missing',
        currentPassword: 'x',
        newPassword: 'brand-new-pass1',
      } as never),
    ).rejects.toMatchObject({ error: { statusCode: 404 } });
  });

  it('rejects when the current password is wrong (401)', async () => {
    const { db } = fakeDb([await userWithPassword('the-real-one')]);
    const service = new PasswordService(db as never, jwt(), email(), config());
    await expect(
      service.changePassword({
        userId: 'u1',
        currentPassword: 'wrong-guess',
        newPassword: 'brand-new-pass1',
      } as never),
    ).rejects.toMatchObject({ error: { statusCode: 401 } });
  });

  it('rehashes and invalidates sessions when the current password matches', async () => {
    const { db, setSpy } = fakeDb([await userWithPassword('the-real-one')]);
    const service = new PasswordService(db as never, jwt(), email(), config());

    const result = await service.changePassword({
      userId: 'u1',
      currentPassword: 'the-real-one',
      newPassword: 'brand-new-pass1',
    } as never);

    expect(result.message).toMatch(/changed successfully/i);
    const payload = setSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.refreshToken).toBeNull();
    expect(await bcrypt.compare('brand-new-pass1', payload.password as string)).toBe(true);
  });
});
