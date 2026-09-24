import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { courseRatings } from '@app/database/schemas/course/course-rating.schema';
import { enrollments } from '@app/database/schemas/course/enrollment.schema';
import { user } from '@app/database/schemas/user/user.schema';
import {
  DeleteResponseDTO,
  DRIZZLE,
  IRatingService,
  RatingResponseDTO,
  RatingSummaryResponseDTO,
  UpsertRatingRequestDTO,
} from '@app/contracts';
import { RpcForbiddenException, RpcNotFoundException } from '@app/common';

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
      throw new RpcForbiddenException(
        'Enroll in this course before rating it',
      );
    }

    const review = dto.review?.trim() ? dto.review.trim() : null;
    const [saved] = await this.db
      .insert(courseRatings)
      .values({ userId, courseId, rating: dto.rating, review })
      .onConflictDoUpdate({
        target: [courseRatings.userId, courseRatings.courseId],
        set: { rating: dto.rating, review, updatedAt: new Date() },
      })
      .returning();

    this.logger.log(`User ${userId} rated course ${courseId}: ${dto.rating}`);
    return this.toDTO({ ...saved, firstName: null, lastName: null, avatar: null });
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
    return this.toDTO({ ...found, firstName: null, lastName: null, avatar: null });
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
