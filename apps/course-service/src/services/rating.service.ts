import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, desc, eq, isNotNull, not, sql, type SQL } from 'drizzle-orm';
import { courseRatings } from '@app/database/schemas/course/course-rating.schema';
import { enrollments } from '@app/database/schemas/course/enrollment.schema';
import { courses } from '@app/database/schemas/course/course.schema';
import { user } from '@app/database/schemas/user/user.schema';
import {
  ADMIN_REVIEWS_LIMIT,
  AdminReviewDTO,
  DEMO_EMAIL_DOMAIN,
  DeleteResponseDTO,
  DRIZZLE,
  FeaturedReviewDTO,
  FeaturedReviewsResponseDTO,
  IRatingService,
  RatingResponseDTO,
  RatingSummaryResponseDTO,
  UpsertRatingRequestDTO,
} from '@app/contracts';
import {
  RpcBadRequestException,
  RpcForbiddenException,
  RpcNotFoundException,
} from '@app/common';

@Injectable()
export class RatingService implements IRatingService {
  private readonly logger = new Logger(RatingService.name);

  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

  /**
   * Creates or replaces the learner's rating of a course.
   *
   * Enrolment is required: a rating from someone who never opened the course
   * is not a signal, and without the check the average is open to anyone with
   * an account. Enrolment rather than completion, because a learner partway
   * through still has a real opinion.
   */
  async upsert(
    userId: string,
    courseId: string,
    dto: UpsertRatingRequestDTO,
  ): Promise<RatingResponseDTO> {
    const [enrollment] = await this.db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
      )
      .limit(1);
    if (!enrollment) {
      throw new RpcForbiddenException('Enroll in this course before rating it');
    }

    const review = dto.review?.trim() ? dto.review.trim() : null;
    const [saved] = await this.db
      .insert(courseRatings)
      .values({ userId, courseId, rating: dto.rating, review })
      .onConflictDoUpdate({
        target: [courseRatings.userId, courseRatings.courseId],
        set: {
          rating: dto.rating,
          review,
          // Approval covers the text an admin read. Any edit — text or stars —
          // takes the review off the landing page until it is featured again.
          featured: sql`${courseRatings.featured} and ${courseRatings.review} is not distinct from excluded.review and ${courseRatings.rating} = excluded.rating`,
          updatedAt: new Date(),
        },
      })
      .returning();

    this.logger.log(`User ${userId} rated course ${courseId}: ${dto.rating}`);
    return this.toDTO({
      ...saved,
      firstName: null,
      lastName: null,
      avatar: null,
    });
  }

  async remove(userId: string, courseId: string): Promise<DeleteResponseDTO> {
    const [deleted] = await this.db
      .delete(courseRatings)
      .where(
        and(
          eq(courseRatings.userId, userId),
          eq(courseRatings.courseId, courseId),
        ),
      )
      .returning({ id: courseRatings.id });
    if (!deleted) throw new RpcNotFoundException('Rating not found');
    return new DeleteResponseDTO({
      message: 'Rating removed successfully',
      id: deleted.id,
    });
  }

  /**
   * The course's rating summary plus its most recent written reviews.
   *
   * `average` is null rather than 0 when nothing has been rated, so a client
   * cannot render an unrated course as a zero-star one. Ratings left without
   * text still count toward the average and distribution but are not listed —
   * a review list of empty cards is noise.
   */
  async findByCourse(
    courseId: string,
    limit: number,
  ): Promise<RatingSummaryResponseDTO> {
    const buckets = await this.db
      .select({
        rating: courseRatings.rating,
        count: sql<number>`count(*)`,
      })
      .from(courseRatings)
      .where(eq(courseRatings.courseId, courseId))
      .groupBy(courseRatings.rating);

    const distribution: Record<string, number> = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
    };
    let count = 0;
    let total = 0;
    for (const bucket of buckets) {
      const n = Number(bucket.count);
      distribution[String(bucket.rating)] = n;
      count += n;
      total += n * bucket.rating;
    }

    const rows = await this.db
      .select({
        id: courseRatings.id,
        rating: courseRatings.rating,
        review: courseRatings.review,
        createdAt: courseRatings.createdAt,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      })
      .from(courseRatings)
      .innerJoin(user, eq(courseRatings.userId, user.id))
      .where(
        and(
          eq(courseRatings.courseId, courseId),
          isNotNull(courseRatings.review),
        ),
      )
      .orderBy(desc(courseRatings.createdAt))
      .limit(limit);

    return new RatingSummaryResponseDTO({
      average: count > 0 ? Math.round((total / count) * 10) / 10 : null,
      count,
      distribution,
      items: rows.map((row) => this.toDTO(row)),
    });
  }

  /** The learner's own rating, so the form can open pre-filled. */
  async findMine(
    userId: string,
    courseId: string,
  ): Promise<RatingResponseDTO | null> {
    const [found] = await this.db
      .select()
      .from(courseRatings)
      .where(
        and(
          eq(courseRatings.userId, userId),
          eq(courseRatings.courseId, courseId),
        ),
      )
      .limit(1);
    if (!found) return null;
    return this.toDTO({
      ...found,
      firstName: null,
      lastName: null,
      avatar: null,
    });
  }

  /**
   * Landing-page reviews: the admin-featured written reviews on published
   * courses, plus the overall average and count across *every* rating on
   * published courses — so curating quotes cannot hide a low score.
   *
   * In production, seeded demo accounts are excluded from both, so demo data
   * can never reach real visitors even if the seed script was run by mistake.
   */
  async findFeatured(limit: number): Promise<FeaturedReviewsResponseDTO> {
    const scope: SQL[] = [eq(courses.published, true)];
    if (process.env.NODE_ENV === 'production') {
      scope.push(not(sql`${user.email} ilike ${'%@' + DEMO_EMAIL_DOMAIN}`));
    }

    const [summary] = await this.db
      .select({
        count: sql<number>`count(*)::int`,
        average: sql<number | null>`avg(${courseRatings.rating})::float`,
      })
      .from(courseRatings)
      .innerJoin(courses, eq(courseRatings.courseId, courses.id))
      .innerJoin(user, eq(courseRatings.userId, user.id))
      .where(and(...scope));

    const rows = await this.db
      .select({
        id: courseRatings.id,
        rating: courseRatings.rating,
        review: courseRatings.review,
        createdAt: courseRatings.createdAt,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        courseTitle: courses.title,
        courseTitleKm: courses.titleKm,
        courseSlug: courses.slug,
      })
      .from(courseRatings)
      .innerJoin(courses, eq(courseRatings.courseId, courses.id))
      .innerJoin(user, eq(courseRatings.userId, user.id))
      .where(
        and(
          ...scope,
          eq(courseRatings.featured, true),
          isNotNull(courseRatings.review),
        ),
      )
      .orderBy(desc(courseRatings.updatedAt))
      .limit(limit);

    const count = summary?.count ?? 0;
    const average =
      count > 0 && summary?.average != null
        ? Math.round(summary.average * 10) / 10
        : null;

    return new FeaturedReviewsResponseDTO({
      average,
      count,
      items: rows.map(
        (row) =>
          new FeaturedReviewDTO({
            ...this.toDTO(row),
            courseTitle: row.courseTitle,
            courseTitleKm: row.courseTitleKm,
            courseSlug: row.courseSlug,
          }),
      ),
    });
  }

  /** Every written review, newest first, for the admin moderation list. */
  async listForAdmin(): Promise<AdminReviewDTO[]> {
    const rows = await this.db
      .select(this.adminColumns())
      .from(courseRatings)
      .innerJoin(courses, eq(courseRatings.courseId, courses.id))
      .innerJoin(user, eq(courseRatings.userId, user.id))
      .where(isNotNull(courseRatings.review))
      .orderBy(desc(courseRatings.updatedAt))
      .limit(ADMIN_REVIEWS_LIMIT);
    return rows.map((row) => this.toAdminDTO(row));
  }

  /** Feature or unfeature one review. Only written reviews can be featured. */
  async setFeatured(id: string, featured: boolean): Promise<AdminReviewDTO> {
    const [existing] = await this.db
      .select({ review: courseRatings.review })
      .from(courseRatings)
      .where(eq(courseRatings.id, id))
      .limit(1);
    if (!existing) throw new RpcNotFoundException('Review not found');
    if (featured && !existing.review) {
      throw new RpcBadRequestException('Only written reviews can be featured');
    }

    await this.db
      .update(courseRatings)
      .set({ featured })
      .where(eq(courseRatings.id, id));

    const [row] = await this.db
      .select(this.adminColumns())
      .from(courseRatings)
      .innerJoin(courses, eq(courseRatings.courseId, courses.id))
      .innerJoin(user, eq(courseRatings.userId, user.id))
      .where(eq(courseRatings.id, id))
      .limit(1);

    this.logger.log(`Review ${id} ${featured ? 'featured' : 'unfeatured'}`);
    return this.toAdminDTO(row);
  }

  private adminColumns() {
    return {
      id: courseRatings.id,
      rating: courseRatings.rating,
      review: courseRatings.review,
      featured: courseRatings.featured,
      createdAt: courseRatings.createdAt,
      updatedAt: courseRatings.updatedAt,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      email: user.email,
      courseTitle: courses.title,
    };
  }

  private toAdminDTO(row: {
    id: string;
    rating: number;
    review: string | null;
    featured: boolean;
    createdAt: Date;
    updatedAt: Date;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    email: string;
    courseTitle: string;
  }): AdminReviewDTO {
    return new AdminReviewDTO({
      id: row.id,
      rating: row.rating,
      review: row.review ?? '',
      featured: row.featured,
      displayName: this.toDTO(row).displayName,
      email: row.email,
      courseTitle: row.courseTitle,
      updatedAt: row.updatedAt,
    });
  }

  /**
   * Reviews carry a first name plus last initial and never an email — the same
   * rule the leaderboard follows, because a course page is public and this
   * platform teaches Grade 1–12.
   */
  private toDTO(row: {
    id: string;
    rating: number;
    review: string | null;
    createdAt: Date;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
  }): RatingResponseDTO {
    const initial = row.lastName?.trim()?.[0];
    const displayName =
      [row.firstName?.trim(), initial ? `${initial}.` : null]
        .filter(Boolean)
        .join(' ') || 'Learner';

    return new RatingResponseDTO({
      id: row.id,
      rating: row.rating,
      review: row.review,
      displayName,
      avatar: row.avatar,
      createdAt: row.createdAt,
    });
  }
}
