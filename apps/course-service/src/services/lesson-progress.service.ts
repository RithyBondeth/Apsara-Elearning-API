import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { lessonProgress } from '@app/database/schemas/course/lessons/lesson-progress.schema';
import { lessons } from '@app/database/schemas/course/lessons/lesson.schema';
import { modules } from '@app/database/schemas/course/module.schema';
import { enrollments } from '@app/database/schemas/course/enrollment.schema';
import {
  DRIZZLE,
  EnrollmentResponseDTO,
  ILessonProgressService,
  LessonCompletionResponseDTO,
  LessonProgressResponseDTO,
  USER_SERVICE,
} from '@app/contracts';
import {
  CourseEntitlementService,
  RpcBadRequestException,
  RpcNotFoundException,
} from '@app/common';
import { LEARNER_TIMEZONE, learnerToday, streakFromDays } from '@app/utils';
import { CertificateService } from './certificate.service';

/** XP granted the first time a lesson is completed. */
const XP_PER_LESSON = 10;

/** Upper bound on the completion days read back when recomputing a streak. */
const MAX_STREAK_DAYS = 400;

@Injectable()
export class LessonProgressService implements ILessonProgressService {
  private readonly logger = new Logger(LessonProgressService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    @Inject(USER_SERVICE.NAME) private readonly userClient: ClientProxy,
    private readonly entitlements: CourseEntitlementService,
    private readonly certificates: CertificateService,
  ) {}

  async markComplete(
    userId: string,
    lessonId: string,
  ): Promise<LessonCompletionResponseDTO> {
    const courseId = await this.courseIdForLesson(lessonId);
    await this.entitlements.assertCanEnroll(userId, courseId);
    await this.ensureEnrolled(userId, courseId);

    const alreadyCompleted = await this.isCompleted(userId, lessonId);

    const now = new Date();
    await this.db
      .insert(lessonProgress)
      .values({ userId, lessonId, completed: true, completedAt: now })
      .onConflictDoUpdate({
        target: [lessonProgress.userId, lessonProgress.lessonId],
        set: { completed: true, completedAt: now, updatedAt: now },
      });

    const enrollment = await this.recalculate(userId, courseId);

    // Only award XP the first time this lesson is completed.
    let xpAwarded = 0;
    if (!alreadyCompleted) {
      xpAwarded = await this.grantXp(userId, XP_PER_LESSON);
    }

    // Recompute from the completion history rather than incrementing, so a
    // second lesson on the same day doesn't inflate the streak and a returning
    // learner's broken streak is corrected rather than resumed.
    await this.syncStreak(userId);

    if (enrollment.completed) {
      await this.issueCertificate(userId, courseId);
    }

    this.logger.log(`User ${userId} completed lesson ${lessonId}`);
    return new LessonCompletionResponseDTO({
      lessonId,
      completed: true,
      enrollment,
      xpAwarded,
    });
  }

  private async isCompleted(userId: string, lessonId: string) {
    const [row] = await this.db
      .select({ completed: lessonProgress.completed })
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, userId),
          eq(lessonProgress.lessonId, lessonId),
        ),
      )
      .limit(1);
    return !!row?.completed;
  }

  /**
   * Recomputes the learner's consecutive-day streak from their completion
   * history and pushes the absolute value to user-service.
   *
   * course-service owns `lesson_progress`, so it does the counting; user-service
   * just persists the number it is given. Days are bucketed in the learner's
   * timezone, not UTC — see LEARNER_TIMEZONE.
   */
  private async syncStreak(userId: string): Promise<void> {
    try {
      const day = sql<string>`((${lessonProgress.completedAt} AT TIME ZONE ${LEARNER_TIMEZONE})::date)::text`;
      const rows = await this.db
        .selectDistinct({ day })
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, userId),
            eq(lessonProgress.completed, true),
            isNotNull(lessonProgress.completedAt),
          ),
        );

      // Sorted here rather than in SQL on purpose. Postgres requires a SELECT
      // DISTINCT query's ORDER BY expression to appear in the select list, and
      // drizzle renders the two sides with different table qualifiers — so an
      // ORDER BY on this expression is a runtime risk for no benefit. These are
      // ISO dates, where lexicographic order is chronological order, and the
      // row count is bounded by the learner's number of active days.
      const days = rows
        .map((row) => row.day)
        .sort()
        .reverse()
        .slice(0, MAX_STREAK_DAYS);

      const streak = streakFromDays(days, learnerToday());

      await firstValueFrom(
        this.userClient
          .send(USER_SERVICE.ACTIONS.UPDATE_STREAK, { userId, streak })
          .pipe(timeout(5000)),
      );
    } catch (error) {
      // A streak is cosmetic; never fail a completion over it.
      this.logger.error(
        `Failed to sync streak for ${userId}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /**
   * Issues the course certificate once the last lesson lands.
   *
   * Best-effort: a learner without the certificates entitlement (or one whose
   * issue simply fails) must still get their lesson marked complete. They can
   * claim it later through the explicit endpoint — issuing is idempotent.
   */
  private async issueCertificate(
    userId: string,
    courseId: string,
  ): Promise<void> {
    try {
      await this.certificates.issue(userId, courseId);
    } catch (error) {
      this.logger.debug(
        `No certificate issued for ${userId} on ${courseId}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /** Fire XP grant to user-service; never let a failure break completion. */
  private async grantXp(userId: string, amount: number): Promise<number> {
    try {
      await firstValueFrom(
        this.userClient
          .send(USER_SERVICE.ACTIONS.ADD_XP, { userId, amount })
          .pipe(timeout(5000)),
      );
      return amount;
    } catch (error) {
      this.logger.error(
        `Failed to award XP to ${userId}: ${error instanceof Error ? error.message : error}`,
      );
      return 0;
    }
  }

  async findByUser(userId: string): Promise<LessonProgressResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, userId));
    return rows.map((row) => new LessonProgressResponseDTO(row));
  }

  async findByLesson(
    userId: string,
    lessonId: string,
  ): Promise<LessonProgressResponseDTO> {
    const [found] = await this.db
      .select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, userId),
          eq(lessonProgress.lessonId, lessonId),
        ),
      )
      .limit(1);
    return new LessonProgressResponseDTO(
      found ?? { userId, lessonId, completed: false },
    );
  }

  /** Recomputes an enrollment's progressPercent / completed flags. */
  async recalculate(
    userId: string,
    courseId: string,
  ): Promise<EnrollmentResponseDTO> {
    const lessonRows = await this.db
      .select({ id: lessons.id })
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .where(eq(modules.courseId, courseId));

    const total = lessonRows.length;
    let completed = 0;
    if (total > 0) {
      const completedRows = await this.db
        .select({ id: lessonProgress.id })
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, userId),
            eq(lessonProgress.completed, true),
            inArray(
              lessonProgress.lessonId,
              lessonRows.map((r) => r.id),
            ),
          ),
        );
      completed = completedRows.length;
    }

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isComplete = total > 0 && completed === total;

    const [updated] = await this.db
      .update(enrollments)
      .set({
        progressPercent: percent,
        completed: isComplete,
        completedAt: isComplete ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(
        and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
      )
      .returning();

    if (!updated) throw new RpcNotFoundException('Enrollment not found');
    return new EnrollmentResponseDTO(updated);
  }

  private async courseIdForLesson(lessonId: string): Promise<string> {
    const [row] = await this.db
      .select({ courseId: modules.courseId })
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .where(eq(lessons.id, lessonId))
      .limit(1);
    if (!row) throw new RpcNotFoundException('Lesson not found');
    return row.courseId;
  }

  private async ensureEnrolled(userId: string, courseId: string) {
    const [enrollment] = await this.db
      .select()
      .from(enrollments)
      .where(
        and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
      )
      .limit(1);
    if (!enrollment) {
      throw new RpcBadRequestException('You are not enrolled in this course');
    }
  }
}
