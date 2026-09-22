import { EntitlementService } from '@app/common';
import { EntitlementAdminService } from './entitlement-admin.service';

/**
 * Admin grant/revoke input rules and audit semantics: an expiry must be after
 * the start, effect defaults to "allow", revoke only touches an active
 * (non-revoked) grant, and a missing target is a clean 404.
 */

const entitlements = {
  resolveAll: jest.fn().mockResolvedValue([]),
} as unknown as EntitlementService;

function grantRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'g1',
    userId: 'u1',
    grantedBy: 'admin1',
    entitlement: 'ai:tutor',
    effect: 'allow',
    startsAt: new Date(),
    expiresAt: null,
    reason: 'courtesy',
    revokedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/** Captures insert/update payloads and returns queued `returning()` rows. */
function fakeDb(opts: { created?: unknown[]; revoked?: unknown[]; selectRows?: unknown[] } = {}) {
  const valuesSpy = jest.fn(() => ({
    returning: () => Promise.resolve(opts.created ?? []),
  }));
  const setSpy = jest.fn(() => ({
    where: () => ({ returning: () => Promise.resolve(opts.revoked ?? []) }),
  }));
  const db = {
    insert: () => ({ values: valuesSpy }),
    update: () => ({ set: setSpy }),
    select: () => {
      const node: Record<string, unknown> = {};
      for (const m of ['from', 'where', 'orderBy']) node[m] = () => node;
      node.then = (res: (v: unknown) => unknown) =>
        Promise.resolve(opts.selectRows ?? []).then(res);
      return node;
    },
  };
  return { db, valuesSpy, setSpy };
}

describe('EntitlementAdminService.grant', () => {
  it('rejects an expiry that is not after the start (400)', async () => {
    const { db } = fakeDb();
    const service = new EntitlementAdminService(db as never, entitlements);

    await expect(
      service.grant('u1', 'admin1', {
        entitlement: 'ai:tutor',
        startsAt: '2026-01-02T00:00:00.000Z',
        expiresAt: '2026-01-01T00:00:00.000Z',
        reason: 'oops',
      }),
    ).rejects.toMatchObject({ error: { statusCode: 400 } });
  });

  it('defaults the effect to "allow" and persists the actor', async () => {
    const { db, valuesSpy } = fakeDb({ created: [grantRow()] });
    const service = new EntitlementAdminService(db as never, entitlements);

    await service.grant('u1', 'admin1', {
      entitlement: 'ai:tutor',
      reason: 'courtesy',
    });

    const payload = valuesSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.effect).toBe('allow');
    expect(payload.grantedBy).toBe('admin1');
    expect(payload.expiresAt).toBeNull();
    expect(payload.startsAt).toBeInstanceOf(Date);
  });

  it('passes an explicit deny effect through unchanged', async () => {
    const { db, valuesSpy } = fakeDb({ created: [grantRow({ effect: 'deny' })] });
    const service = new EntitlementAdminService(db as never, entitlements);

    const dto = await service.grant('u1', 'admin1', {
      entitlement: 'courses:premium',
      effect: 'deny',
      reason: 'abuse hold',
    });

    expect((valuesSpy.mock.calls[0][0] as { effect: string }).effect).toBe('deny');
    expect(dto.effect).toBe('deny');
  });
});

describe('EntitlementAdminService.revoke', () => {
  it('returns the revoked grant when an active one is found', async () => {
    const { db, setSpy } = fakeDb({
      revoked: [grantRow({ revokedAt: new Date() })],
    });
    const service = new EntitlementAdminService(db as never, entitlements);

    const dto = await service.revoke('g1');

    expect(dto.id).toBe('g1');
    // Revocation stamps a timestamp rather than deleting the row (audit trail).
    expect((setSpy.mock.calls[0][0] as { revokedAt: Date }).revokedAt).toBeInstanceOf(Date);
  });

  it('throws 404 when no active grant matches (already revoked or missing)', async () => {
    const { db } = fakeDb({ revoked: [] });
    const service = new EntitlementAdminService(db as never, entitlements);

    await expect(service.revoke('missing')).rejects.toMatchObject({
      error: { statusCode: 404 },
    });
  });
});

describe('EntitlementAdminService.findGrants', () => {
  it('maps stored rows to grant DTOs', async () => {
    const { db } = fakeDb({ selectRows: [grantRow(), grantRow({ id: 'g2' })] });
    const service = new EntitlementAdminService(db as never, entitlements);

    const dtos = await service.findGrants('u1');

    expect(dtos).toHaveLength(2);
    expect(dtos.map((d) => d.id)).toEqual(['g1', 'g2']);
  });
});
