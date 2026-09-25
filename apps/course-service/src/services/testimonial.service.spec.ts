import { TestimonialService } from './testimonial.service';

/** insert/update/delete chains that record their input and resolve queued rows. */
function fakeDb(returning: unknown[][] = []) {
  let i = 0;
  const written: unknown[] = [];
  const terminal = () => ({
    returning: () => Promise.resolve(returning[i++] ?? []),
  });
  const db = {
    insert: () => ({
      values: (v: unknown) => {
        written.push(v);
        return terminal();
      },
    }),
    update: () => ({
      set: (v: unknown) => {
        written.push(v);
        return { where: terminal };
      },
    }),
    delete: () => ({ where: terminal }),
  };
  return { db, written };
}

const valid = {
  name: ' Sophea K. ',
  role: 'Grade 12 Chemistry teacher, Phnom Penh',
  quote: 'My students use it every evening.',
  consentSource: 'Signed consent form, Grade 12 pilot',
  consentedAt: '2026-09-20',
};

describe('TestimonialService', () => {
  it('creates an unpublished testimonial with its consent record', async () => {
    const { db, written } = fakeDb([
      [{ id: 't1', ...valid, published: false }],
    ]);
    const service = new TestimonialService(db as never);

    await service.create(valid);

    expect(written[0]).toMatchObject({
      name: 'Sophea K.',
      consentSource: 'Signed consent form, Grade 12 pilot',
      consentedAt: '2026-09-20',
      published: false,
    });
  });

  it('rejects a consent date in the future', async () => {
    const { db, written } = fakeDb();
    const service = new TestimonialService(db as never);

    await expect(
      service.create({ ...valid, consentedAt: '2999-01-01' }),
    ).rejects.toThrow('Consent date cannot be in the future');
    expect(written).toEqual([]);
  });

  it('validates a changed consent date on update too', async () => {
    const { db } = fakeDb();
    const service = new TestimonialService(db as never);

    await expect(
      service.update('t1', { consentedAt: '2999-01-01' }),
    ).rejects.toThrow('Consent date cannot be in the future');
  });

  it('throws when updating or deleting a missing testimonial', async () => {
    const { db } = fakeDb([[], []]);
    const service = new TestimonialService(db as never);

    await expect(service.update('x', { published: true })).rejects.toThrow(
      'Testimonial not found',
    );
    await expect(service.remove('x')).rejects.toThrow('Testimonial not found');
  });
});
