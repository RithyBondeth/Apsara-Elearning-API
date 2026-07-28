import { CourseEntitlementService } from './course-entitlement.service';

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
  const db = {
    select: jest.fn().mockImplementation(() => queries.shift()),
  };
  return { service: new CourseEntitlementService(db as never), db };
}

describe('CourseEntitlementService', () => {
  it('allows a published free course without querying subscriptions', async () => {
    const { service, db } = serviceWith([
      {
        courseId: 'course-1',
        published: true,
        requiresSubscription: false,
      },
    ]);

    await expect(service.assertCanEnroll('user-1', 'course-1')).resolves.toBe(
      undefined,
    );
    expect(db.select).toHaveBeenCalledTimes(1);
  });

  it('rejects premium content for a user without an active subscription', async () => {
    const { service } = serviceWith(
      [
        {
          courseId: 'course-1',
          published: true,
          requiresSubscription: true,
        },
      ],
      [],
    );

    await expect(service.assertCanEnroll('user-1', 'course-1')).rejects.toThrow(
      'An active subscription is required',
    );
  });

  it('allows premium content with an active subscription', async () => {
    const { service } = serviceWith(
      [
        {
          courseId: 'course-1',
          published: true,
          requiresSubscription: true,
        },
      ],
      [{ id: 'subscription-1' }],
    );

    await expect(service.assertCanEnroll('user-1', 'course-1')).resolves.toBe(
      undefined,
    );
  });

  it('hides unpublished courses as not found', async () => {
    const { service } = serviceWith([
      {
        courseId: 'course-1',
        published: false,
        requiresSubscription: false,
      },
    ]);

    await expect(service.assertPublishedCourse('course-1')).rejects.toThrow(
      'Course not found',
    );
  });
});
