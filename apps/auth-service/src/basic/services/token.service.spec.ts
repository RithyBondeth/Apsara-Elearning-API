import { hashRefreshToken, JwtService } from '@app/common';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';

/**
 * The refresh flow is the whole session-security surface: a stale, forged, or
 * already-rotated token must never mint a new pair. These tests pin every
 * branch of that check plus the compare-and-swap that makes rotation
 * single-use.
 */

const VALID = 'valid-refresh-token';

/** Chainable Drizzle stand-in for one select and one update-with-returning. */
function fakeDb(opts: { selectRows?: unknown[]; rotatedRows?: unknown[] }) {
  return {
    select: () => {
      const node: Record<string, unknown> = {};
      for (const m of ['from', 'where', 'limit']) node[m] = () => node;
      node.then = (
        res: (v: unknown) => unknown,
        rej: (r: unknown) => unknown,
      ) => Promise.resolve(opts.selectRows ?? []).then(res, rej);
      return node;
    },
    update: () => {
      const node: Record<string, unknown> = {};
      node.set = () => node;
      node.where = () => node;
      node.returning = () => Promise.resolve(opts.rotatedRows ?? []);
      node.then = (
        res: (v: unknown) => unknown,
        rej: (r: unknown) => unknown,
      ) => Promise.resolve(undefined).then(res, rej);
      return node;
    },
  };
}

function jwt(overrides: Record<string, jest.Mock> = {}) {
  return {
    verifyRefreshToken: jest
      .fn()
      .mockResolvedValue({ id: 'u1', type: 'refresh' }),
    generateToken: jest.fn().mockResolvedValue('new-access'),
    generateRefreshToken: jest.fn().mockResolvedValue('new-refresh'),
    ...overrides,
  } as unknown as JwtService;
}

const config = { get: () => '7d' } as unknown as ConfigService;

function verifiedUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'u1',
    email: 'a@b.com',
    isAdmin: false,
    isEmailVerified: true,
    refreshToken: hashRefreshToken(VALID),
    refreshTokenExpiresAt: new Date(Date.now() + 60_000),
    ...overrides,
  };
}

const UNAUTHORIZED = { error: { statusCode: 401 } };

describe('TokenService.refresh', () => {
  it('rotates and returns a fresh token pair for a valid token', async () => {
    const db = fakeDb({ selectRows: [verifiedUser()], rotatedRows: [{ id: 'u1' }] });
    const service = new TokenService(db as never, jwt(), config);

    const result = await service.refresh(VALID);

    expect(result.accessToken).toBe('new-access');
    expect(result.refreshToken).toBe('new-refresh');
  });

  it('persists the digest of the new refresh token, never the raw token', async () => {
    const setSpy = jest.fn().mockReturnThis();
    const db = {
      select: () => {
        const node: Record<string, unknown> = {};
        for (const m of ['from', 'where', 'limit']) node[m] = () => node;
        node.then = (res: (v: unknown) => unknown) =>
          Promise.resolve([verifiedUser()]).then(res);
        return node;
      },
      update: () => ({
        set: (v: unknown) => {
          setSpy(v);
          return { where: () => ({ returning: () => Promise.resolve([{ id: 'u1' }]) }) };
        },
      }),
    };

    await new TokenService(db as never, jwt(), config).refresh(VALID);

    const stored = setSpy.mock.calls[0][0] as { refreshToken: string };
    expect(stored.refreshToken).toBe(hashRefreshToken('new-refresh'));
    expect(stored.refreshToken).not.toBe('new-refresh');
  });

  it('rejects a token whose signature does not verify', async () => {
    const db = fakeDb({ selectRows: [verifiedUser()] });
    const service = new TokenService(
      db as never,
      jwt({ verifyRefreshToken: jest.fn().mockRejectedValue(new Error('bad')) }),
      config,
    );
    await expect(service.refresh('nope')).rejects.toMatchObject(UNAUTHORIZED);
  });

  it('rejects when no user matches the token subject', async () => {
    const db = fakeDb({ selectRows: [] });
    const service = new TokenService(db as never, jwt(), config);
    await expect(service.refresh(VALID)).rejects.toMatchObject(UNAUTHORIZED);
  });

  it('rejects when the stored digest does not match the presented token', async () => {
    const db = fakeDb({
      selectRows: [verifiedUser({ refreshToken: hashRefreshToken('some-other-token') })],
    });
    const service = new TokenService(db as never, jwt(), config);
    await expect(service.refresh(VALID)).rejects.toMatchObject(UNAUTHORIZED);
  });

  it('rejects an expired stored refresh token', async () => {
    const db = fakeDb({
      selectRows: [verifiedUser({ refreshTokenExpiresAt: new Date(Date.now() - 1) })],
    });
    const service = new TokenService(db as never, jwt(), config);
    await expect(service.refresh(VALID)).rejects.toMatchObject(UNAUTHORIZED);
  });

  it('rejects a user whose email is not verified', async () => {
    const db = fakeDb({ selectRows: [verifiedUser({ isEmailVerified: false })] });
    const service = new TokenService(db as never, jwt(), config);
    await expect(service.refresh(VALID)).rejects.toMatchObject(UNAUTHORIZED);
  });

  it('rejects when the compare-and-swap rotates zero rows (token already used)', async () => {
    // A concurrent request rotated first, so the CAS update matches nothing.
    const db = fakeDb({ selectRows: [verifiedUser()], rotatedRows: [] });
    const service = new TokenService(db as never, jwt(), config);
    await expect(service.refresh(VALID)).rejects.toMatchObject(UNAUTHORIZED);
  });
});

describe('TokenService.logout', () => {
  it('clears the stored refresh token', async () => {
    const setSpy = jest.fn().mockReturnValue({ where: () => Promise.resolve(undefined) });
    const db = { update: () => ({ set: setSpy }) };
    const service = new TokenService(db as never, jwt(), config);

    const result = await service.logout(VALID);

    expect(result.message).toMatch(/logged out/i);
    expect(setSpy).toHaveBeenCalledWith({
      refreshToken: null,
      refreshTokenExpiresAt: null,
    });
  });

  it('is idempotent and never throws on an invalid token', async () => {
    const db = { update: () => ({ set: () => ({ where: () => Promise.resolve(undefined) }) }) };
    const service = new TokenService(
      db as never,
      jwt({ verifyRefreshToken: jest.fn().mockRejectedValue(new Error('bad')) }),
      config,
    );
    await expect(service.logout('garbage')).resolves.toMatchObject({
      message: expect.stringMatching(/logged out/i),
    });
  });
});
