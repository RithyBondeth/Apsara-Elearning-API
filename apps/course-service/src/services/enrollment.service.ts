import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { enrollments } from '@app/database/schemas/course/enrollment.schema';
import { courses } from '@app/database/schemas/course/course.schema';
import { modules } from '@app/database/schemas/course/module.schema';
import { lessons } from '@app/database/schemas/course/lessons/lesson.schema';
import { lessonProgress } from '@app/database/schemas/course/lessons/lesson-progress.schema';
import {
  DRIZZLE,
  EnrollmentResponseDTO,
  ContinueLearningDTO,
  ContinueLessonDTO,
  EnrollmentCheckResponseDTO,
  UnenrollResponseDTO,
  IEnrollmentService,
} from '@app/contracts';
import {
  CourseEntitlementService,
  RpcBadRequestException,
  RpcNotFoundException,
} from '@app/common';

@Injectable()
export class EnrollmentService implements IEnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    private readonly entitlements: CourseEntitlementService,
  ) {}

  async enroll(
    userId: string,
    courseId: string,
  ): Promise<EnrollmentResponseDTO> {
    const [course] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);
    if (!course) throw new RpcBadRequestException('Course does not exist');
    if (!course.published) {
      throw new RpcBadRequestException(
        'Course is not available for enrollment',
      );
    }
    await this.entitlements.assertCanEnroll(userId, courseId);

    const existing = await this.findEnrollment(userId, courseId);
    if (existing) {
      throw new RpcBadRequestException('Already enrolled in this course');
    }

    const [created] = await this.db
      .insert(enrollments)
      .values({ userId, courseId })
      .returning();
    this.logger.log(`User ${userId} enrolled in course ${courseId}`);
    return new EnrollmentResponseDTO(created);
  }

  async unenroll(
    userId: string,
    courseId: string,
  ): Promise<UnenrollResponseDTO> {
    const [deleted] = await this.db
      .delete(enrollments)
      .where(
        and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
      )
      .returning();
    if (!deleted) throw new RpcNotFoundException('Enrollment not found');
    this.logger.log(`User ${userId} unenrolled from course ${courseId}`);
    return new UnenrollResponseDTO({
      message: 'Unenrolled successfully',
      courseId,
    });
  }

  async findByUser(userId: string): Promise<EnrollmentResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, userId))
      .orderBy(enrollments.enrolledAt);
    return rows.map((row) => new EnrollmentResponseDTO(row));
  }

  /**
   * "Pick up where you left off" — in-progress courses, most recently worked
   * on first, each with the next lesson to open.
   *
   * Ordered by `enrollments.updatedAt`, which `recalculate` bumps on every
   * lesson completion, so it tracks real activity rather than enrolment date.
   * Resuming by enrolment date sends a learner back to a course they signed up
   * for and never opened.
   *
   * Three queries regardless of how many courses the learner has: the client
   * previously derived this with two requests *per enrolled course*.
   */
  async continueLearning(
    userId: string,
    limit: number,
  ): Promise<ContinueLearningDTO[]> {
    const active = await this.db
      .select({
        courseId: enrollments.courseId,
        progressPercent: enrollments.progressPercent,
        lastActivityAt: enrollments.updatedAt,
        slug: courses.slug,
        title: courses.title,
        titleKm: courses.titleKm,
        thumbnail: courses.thumbnail,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(
        and(
          eq(enrollments.userId, userId),
          // `completed` is nullable, so test for "not true" rather than false.
          ne(sql`coalesce(${enrollments.completed}, false)`, true),
        ),
      )
      .orderBy(desc(enrollments.updatedAt))
      .limit(limit);

    if (active.length === 0) return [];

    const courseIds = active.map((row) => row.courseId);

    // Every lesson of those courses, already in reading order.
    const lessonRows = await this.db
      .select({
        id: lessons.id,
        slug: lessons.slug,
        title: lessons.title,
        courseId: modules.courseId,
        moduleTitle: modules.title,
      })
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .where(inArray(modules.courseId, courseIds))
      .orderBy(asc(modules.order), asc(lessons.order));

    const lessonIds = lessonRows.map((row) => row.id);
    const doneRows = lessonIds.length
      ? await this.db
          .select({ lessonId: lessonProgress.lessonId })
          .from(lessonProgress)
          .where(
            and(
              eq(lessonProgress.userId, userId),
              eq(lessonProgress.completed, true),
              inArray(lessonProgress.lessonId, lessonIds),
            ),
          )
      : [];
    const done = new Set(doneRows.map((row) => row.lessonId));

    const byCourse = new Map<string, typeof lessonRows>();
    for (const lesson of lessonRows) {
      const bucket = byCourse.get(lesson.courseId);
      if (bucket) bucket.push(lesson);
      else byCourse.set(lesson.courseId, [lesson]);
    }

    return active.map((row) => {
      const courseLessons = byCourse.get(row.courseId) ?? [];
      const next = courseLessons.find((lesson) => !done.has(lesson.id)) ?? null;

      return new ContinueLearningDTO({
        courseId: row.courseId,
        courseSlug: row.slug,
        courseTitle: row.title,
        courseTitleKm: row.titleKm,
        thumbnail: row.thumbnail,
        progressPercent: row.progressPercent ?? 0,
        totalLessons: courseLessons.length,
        completedLessons: courseLessons.filter((lesson) => done.has(lesson.id))
          .length,
        nextLesson: next
          ? new ContinueLessonDTO({
              id: next.id,
              slug: next.slug,
              title: next.title,
              moduleTitle: next.moduleTitle,
            })
          : null,
        lastActivityAt: row.lastActivityAt,
      });
    });
  }

  async findByCourse(courseId: string): Promise<EnrollmentResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId))
      .orderBy(enrollments.enrolledAt);
    return rows.map((row) => new EnrollmentResponseDTO(row));
  }

  async check(
    userId: string,
    courseId: string,
  ): Promise<EnrollmentCheckResponseDTO> {
    const enrollment = await this.findEnrollment(userId, courseId);
    return new EnrollmentCheckResponseDTO({
      enrolled: !!enrollment,
      enrollment: enrollment ? new EnrollmentResponseDTO(enrollment) : null,
    });
  }

  private async findEnrollment(userId: string, courseId: string) {
    const [found] = await this.db
      .select()
      .from(enrollments)
      .where(
        and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
      )
      .limit(1);
    return found;
  }
}
