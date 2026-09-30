import { eq } from 'drizzle-orm';
import { of } from 'rxjs';
import type { ClientProxy } from '@nestjs/microservices';
import type { EntitlementService } from '@app/common';
import { certificates } from '@app/database/schemas/course/certificate.schema';
import { user } from '@app/database/schemas/user/user.schema';
import {
  createCourse,
  createUser,
  openTestDb,
  resetDb,
} from '../../../../test/db/test-db';
import { CertificateService } from './certificate.service';

/**
 * Certificate search and revocation against real rows: the ILIKE search
 * (including wildcard escaping), what public verification reveals, and the
 * audit trail surviving the revoking admin's deletion.
 */
const { sql, db } = openTestDb();
const client = { send: jest.fn(() => of({})) } as unknown as ClientProxy;
const service = new CertificateService(
  db as never,
  {} as EntitlementService,
  client,
);
// Real codes use Crockford-style base32 (no I, L, O or U); verify() rejects
// anything else before looking it up.
const CODE_A = 'APS-7TC1-AAAA-0001';
const CODE_B = 'APS-7TC1-BBBB-0002';
const ids: Record<string, string> = {};

beforeAll(async () => {
  await resetDb(sql);
  ids.admin = (await createUser(db, { isAdmin: true })).id;
  const dara = await createUser(db, {
    firstName: 'Sok',
    lastName: 'Dara',
    email: 'dara@int.test',
  });
  const bopha = await createUser(db, {
    firstName: 'Chan',
    lastName: 'Bopha',
    email: 'bopha@int.test',
  });
  const chem = await createCourse(db, { title: 'Chemistry 100%' });
  const bio = await createCourse(db, { title: 'Biology' });
  ids.dara = dara.id;
  ids.certA = (
    await db
      .insert(certificates)
      .values({ userId: dara.id, courseId: chem.id, code: CODE_A })
      .returning()
  )[0].id;
  ids.certB = (
    await db
      .insert(certificates)
      .values({ userId: bopha.id, courseId: bio.id, code: CODE_B })
      .returning()
  )[0].id;
});
afterAll(() => sql.end({ timeout: 1 }));

const codes = async (q: string) =>
  (await service.adminList(q)).map((r) => r.code).sort();

describe('admin search', () => {
  it('matches code, email, full name and course title', async () => {
    expect(await codes('7tc1')).toEqual([CODE_A, CODE_B]);
    expect(await codes('bopha@int')).toEqual([CODE_B]);
    expect(await codes('sok dara')).toEqual([CODE_A]);
    expect(await codes('biology')).toEqual([CODE_B]);
  });

  it('treats % and _ as literal characters', async () => {
    expect(await codes('100%')).toEqual([CODE_A]);
    expect(await codes('_')).toEqual([]);
  });
});

describe('revocation', () => {
  it('revoke → verification says invalid without the reason; reinstate → valid', async () => {
    const reason = 'Answers were shared between accounts';
    const revoked = await service.revoke(ids.certA, ids.admin, reason);
    expect(revoked).toMatchObject({
      revokedBy: ids.admin,
      learnerName: 'Sok Dara',
    });

    const pub = await service.verify(CODE_A);
    expect(pub.valid).toBe(false);
    expect(JSON.stringify(pub)).not.toContain('shared');
    expect((await service.findByUser(ids.dara))[0].revocationReason).toBe(
      reason,
    );

    await service.reinstate(ids.certA, ids.admin);
    expect((await service.verify(CODE_A)).valid).toBe(true);
  });

  it('keeps the revocation when the revoking admin is deleted', async () => {
    await service.revoke(ids.certB, ids.admin, 'Issued to the wrong account');
    await db.delete(user).where(eq(user.id, ids.admin));
    const [row] = await db
      .select()
      .from(certificates)
      .where(eq(certificates.id, ids.certB));
    expect(row.revokedAt).not.toBeNull();
    expect(row.revokedBy).toBeNull();
    expect(row.revocationReason).toBe('Issued to the wrong account');
  });
});
