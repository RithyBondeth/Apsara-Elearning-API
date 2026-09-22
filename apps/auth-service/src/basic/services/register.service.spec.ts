import { EmailService, hashToken, JwtService } from '@app/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RegisterService } from './register.service';

/**
 * Registration must never store a raw password, must not issue session tokens
 * before verification, must survive a lost email-delivery race, and must map a
 * duplicate-key race to a clean 409 rather than a 500.
 */

const VERIFY_TOKEN = 'verify-token';
const SALT = 4;

const dto = {
  email: 'new@b.com',
  password: 'a-strong-password1',
  firstName: 'Sok',
  lastName: 'Dara',
  gender: 'Male',
  phone: '+855123456',
  dateOfBirth: '2000-01-01',
};

function config() {
  return {
    get: (key: string) => (key === 'bcrypt.salt' ? SALT : '1h'),
  } as unknown as ConfigService;
}

function jwt() {
  return {
    generateEmailVerificationToken: jest.fn().mockResolvedValue(VERIFY_TOKEN),
  } as unknown as JwtService;
}

function email(overrides: Record<string, jest.Mock> = {}) {
  return {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as EmailService;
}

/**
 * Drizzle stand-in: `existing` is what the pre-insert lookup returns; the
 * insert resolves unless `insertError` is set (to simulate a DB race/failure).
 */
function fakeDb(opts: { existing?: unknown[]; insertError?: unknown } = {}) {
  const valuesSpy = jest.fn((v: unknown) =>
    opts.insertError ? Promise.reject(opts.insertError) : Promise.resolve(undefined),
  );
  const db = {
    select: () => {
      const node: Record<string, unknown> = {};
      for (const m of ['from', 'where', 'limit']) node[m] = () => node;
      node.then = (res: (v: unknown) => unknown) =>
        Promise.resolve(opts.existing ?? []).then(res);
      return node;
    },
    insert: () => ({ values: valuesSpy }),
  };
  return { db, valuesSpy };
}

describe('RegisterService.register', () => {
  it('rejects a duplicate email up front with a 409', async () => {
    const { db, valuesSpy } = fakeDb({ existing: [{ id: 'u1', email: dto.email }] });
    const service = new RegisterService(db as never, jwt(), email(), config());

    await expect(service.register(dto as never)).rejects.toMatchObject({
      error: { statusCode: 409 },
    });
    expect(valuesSpy).not.toHaveBeenCalled();
  });

  it('hashes the password, stores a hashed verification token, and sends mail', async () => {
    const { db, valuesSpy } = fakeDb();
    const mailer = email();
    const service = new RegisterService(db as never, jwt(), mailer, config());

    const result = await service.register(dto as never);

    expect(result.message).toMatch(/registered successfully/i);
    const stored = valuesSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(stored.password).not.toBe(dto.password);
    expect(await bcrypt.compare(dto.password, stored.password as string)).toBe(true);
    // The raw verification token goes in the email; only its digest is stored.
    expect(stored.emailVerificationToken).toBe(hashToken(VERIFY_TOKEN));
    expect(mailer.sendVerificationEmail).toHaveBeenCalledWith(dto.email, VERIFY_TOKEN);
    // No session tokens are minted before verification.
    expect(stored.refreshToken).toBeUndefined();
  });

  it('still succeeds when the verification email fails to send', async () => {
    const { db } = fakeDb();
    const mailer = email({
      sendVerificationEmail: jest.fn().mockRejectedValue(new Error('smtp down')),
    });
    const service = new RegisterService(db as never, jwt(), mailer, config());

    await expect(service.register(dto as never)).resolves.toMatchObject({
      message: expect.stringMatching(/registered successfully/i),
    });
  });

  it('maps a unique-violation insert race to a 409', async () => {
    const raceError = Object.assign(new Error('duplicate key value'), { code: '23505' });
    const { db } = fakeDb({ insertError: raceError });
    const service = new RegisterService(db as never, jwt(), email(), config());

    await expect(service.register(dto as never)).rejects.toMatchObject({
      error: { statusCode: 409 },
    });
  });

  it('maps an unexpected insert failure to a 500', async () => {
    const { db } = fakeDb({ insertError: new Error('connection reset') });
    const service = new RegisterService(db as never, jwt(), email(), config());

    await expect(service.register(dto as never)).rejects.toMatchObject({
      error: { statusCode: 500 },
    });
  });
});
