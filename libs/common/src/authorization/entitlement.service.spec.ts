import { EntitlementService } from './entitlement.service';

function queryReturning(rows: unknown[]) {
  const query = {
    from: jest.fn(),
    innerJoin: jest.fn(),
    where: jest.fn(),
    limit: jest.fn().mockResolvedValue(rows),
  };
  query.from.mockReturnValue(query);
  query.innerJoin.mockReturnValue(query);
  query.where.mockReturnValue(query);
  return query;
}

function serviceWith(...results: unknown[][]) {
  const queries = results.map(queryReturning);
  const db = { select: jest.fn().mockImplementation(() => queries.shift()) };
  return new EntitlementService(db as never);
}

describe('EntitlementService', () => {
  it('gives an administrative deny highest precedence', async () => {
    const service = serviceWith([{ expiresAt: null }]);
    await expect(service.has('user-1', 'ai:tutor')).resolves.toBe(false);
  });

  it('accepts a current administrative allow', async () => {
    const service = serviceWith(
      [],
      [{ expiresAt: new Date(Date.now() + 1000) }],
    );
    await expect(service.has('user-1', 'certificates')).resolves.toBe(true);
  });

  it('accepts an entitlement supplied by a plan window', async () => {
    const validUntil = new Date(Date.now() + 60_000);
    const service = serviceWith(
      [],
      [],
      [{ expiresAt: validUntil, graceEndsAt: null, trialEndsAt: null }],
    );
    await expect(service.has('user-1', 'courses:premium')).resolves.toBe(true);
  });

  it('denies access when no grant or qualifying plan window exists', async () => {
    const service = serviceWith([], [], []);
    await expect(service.has('user-1', 'ai:tutor')).resolves.toBe(false);
  });
});
