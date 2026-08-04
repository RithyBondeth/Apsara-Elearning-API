import { CertificateService } from './certificate.service';
import type { EntitlementService } from '@app/common';

/**
 * Drizzle stand-in: every builder method chains, and each terminal awaits the
 * next queued result set. Queue order mirrors the order the service queries.
 */
function fakeDb(results: unknown[][]) {
  let index = 0;
  const node = (): Record<string, unknown> => {
    const self: Record<string, unknown> = {};
    for (const method of [
      'from',
      'innerJoin',
      'where',
      'orderBy',
      'limit',
      'values',
      'onConflictDoNothing',
      'returning',
      'set',
    ]) {
      self[method] = () => self;
    }
    self.then = (
      resolve: (value: unknown) => unknown,
      reject: (reason: unknown) => unknown,
    ) => Promise.resolve(results[index++] ?? []).then(resolve, reject);
    return self;
  };
  return { select: () => node(), insert: () => node() };
}

/** Returns the mock alongside, so assertions never reference a method off an instance. */
function buildEntitlements(has: boolean) {
  const hasMock = jest.fn().mockResolvedValue(has);
  return {
    service: { has: hasMock } as unknown as EntitlementService,
    has: hasMock,
  };
}
const entitlements = (has: boolean) => buildEntitlements(has).service;

const COURSE = {
  id: 'course-1',
  title: 'Grade 12 Mathematics',
  titleKm: 'គណិតវិទ្យា',
  slug: 'math',
};
const CERT = {
  id: 'cert-1',
  userId: 'user-1',
  courseId: 'course-1',
  code: 'APS-4K7M-QW2X-9BTF',
  issuedAt: new Date('2026-08-04T00:00:00Z'),
  revokedAt: null,
};

describe('CertificateService.issue', () => {
  it('returns the existing certificate rather than issuing a second', async () => {
    const db = fakeDb([[{ certificate: CERT, course: COURSE }]]);
    const entitle = buildEntitlements(true);
    const service = new CertificateService(db as never, entitle.service);

    const result = await service.issue('user-1', 'course-1');

    expect(result.code).toBe(CERT.code);
    // Already held — entitlement isn't re-checked, so losing a subscription
    // can't retroactively take away a certificate already earned.
    expect(entitle.has).not.toHaveBeenCalled();
  });

  it('refuses when the learner is not enrolled', async () => {
    const db = fakeDb([[], []]);
    const service = new CertificateService(db as never, entitlements(true));

    await expect(service.issue('user-1', 'course-1')).rejects.toThrow(
      /not enrolled/i,
    );
  });

  it('refuses while the course is unfinished', async () => {
    const db = fakeDb([[], [{ completed: false }]]);
    const service = new CertificateService(db as never, entitlements(true));

    await expect(service.issue('user-1', 'course-1')).rejects.toThrow(
      /Finish every lesson/i,
    );
  });

  it('refuses without the certificates entitlement', async () => {
    const db = fakeDb([[], [{ completed: true }]]);
    const service = new CertificateService(db as never, entitlements(false));

    await expect(service.issue('user-1', 'course-1')).rejects.toThrow(
      /plan including certificates/i,
    );
  });

  it('issues once every condition is met', async () => {
    const db = fakeDb([
      [], // no existing certificate
      [{ completed: true }], // enrollment complete
      [COURSE], // course lookup
      [CERT], // insert ... returning
    ]);
    const entitle = buildEntitlements(true);
    const service = new CertificateService(db as never, entitle.service);

    const result = await service.issue('user-1', 'course-1');

    expect(result.code).toBe(CERT.code);
    expect(result.courseTitle).toBe(COURSE.title);
    expect(entitle.has).toHaveBeenCalledWith('user-1', 'certificates');
  });

  it('resolves a concurrent double-issue to the row that landed first', async () => {
    const db = fakeDb([
      [], // no existing certificate
      [{ completed: true }],
      [COURSE],
      [], // insert lost the race, onConflictDoNothing returned nothing
      [{ certificate: CERT, course: COURSE }], // re-read finds the winner
    ]);
    const service = new CertificateService(db as never, entitlements(true));

    await expect(service.issue('user-1', 'course-1')).resolves.toMatchObject({
      code: CERT.code,
    });
  });
});

describe('CertificateService.verify', () => {
  it('reports an unknown code as invalid instead of throwing', async () => {
    // A 404 here would let anyone probe which codes exist.
    const db = fakeDb([[]]);
    const service = new CertificateService(db as never, entitlements(true));

    const result = await service.verify('APS-0000-0000-0000');

    expect(result.valid).toBe(false);
    expect(result.learnerName).toBeUndefined();
  });

  it('rejects a malformed code without hitting the database', async () => {
    const db = fakeDb([]);
    const service = new CertificateService(db as never, entitlements(true));

    await expect(service.verify('not-a-code')).resolves.toMatchObject({
      valid: false,
    });
  });

  it('confirms a valid certificate with just enough detail', async () => {
    const db = fakeDb([
      [
        {
          certificate: CERT,
          course: COURSE,
          firstName: 'Sokha',
          lastName: 'Chan',
        },
      ],
    ]);
    const service = new CertificateService(db as never, entitlements(true));

    const result = await service.verify('aps4k7mqw2x9btf');

    expect(result.valid).toBe(true);
    expect(result.learnerName).toBe('Sokha Chan');
    expect(result.courseTitle).toBe(COURSE.title);
    // Nothing else about the learner is a verifier's business.
    expect(JSON.stringify(result)).not.toContain('user-1');
    expect(Object.keys(result)).not.toContain('email');
  });

  it('reports a revoked certificate as invalid but still resolvable', async () => {
    const revoked = { ...CERT, revokedAt: new Date('2026-08-05T00:00:00Z') };
    const db = fakeDb([
      [
        {
          certificate: revoked,
          course: COURSE,
          firstName: 'Sokha',
          lastName: 'Chan',
        },
      ],
    ]);
    const service = new CertificateService(db as never, entitlements(true));

    const result = await service.verify(CERT.code);

    expect(result.valid).toBe(false);
    expect(result.revokedAt).toEqual(revoked.revokedAt);
  });

  it('falls back to a neutral name when the learner has none set', async () => {
    const db = fakeDb([
      [
        {
          certificate: CERT,
          course: COURSE,
          firstName: null,
          lastName: null,
        },
      ],
    ]);
    const service = new CertificateService(db as never, entitlements(true));

    await expect(service.verify(CERT.code)).resolves.toMatchObject({
      learnerName: 'Learner',
    });
  });
});
