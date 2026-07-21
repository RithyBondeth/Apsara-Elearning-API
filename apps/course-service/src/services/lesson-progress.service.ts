import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, eq, inArray } from 'drizzle-orm';
import { lessonProgress } from '@app/database/schemas/course/lessons/lesson-progress.schema';
import { lessons } from '@app/database/schemas/course/lessons/lesson.schema';
import { modules } from '@app/database/schemas/course/module.schema';
import { enrollments } from '@app/database/schemas/course/enrollment.schema';
import { DRIZZLE, USER_SERVICE } from '@app/contracts';
import { RpcBadRequestException, RpcNotFoundException } from '@app/common';

/** XP granted the first time a lesson is completed. */
const XP_PER_LESSON = 10;

@Injectable()
export class LessonProgressService {
  private readonly logger = new Logger(LessonProgressService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    @Inject(USER_SERVICE.NAME) private readonly userClient: ClientProxy,
  ) {}

  async markComplete(userId: string, lessonId: string) {
    const courseId = await this.courseIdForLesson(lessonId);
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

    this.logger.log(`User ${userId} completed lesson ${lessonId}`);
    return { lessonId, completed: true, enrollment, xpAwarded };
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

  findByUser(userId: string) {
    return this.db
      .select()
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, userId));
  }

  async findByLesson(userId: string, lessonId: string) {
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
    return found ?? { userId, lessonId, completed: false };
  }

  /** Recomputes an enrollment's progressPercent / completed flags. */
  async recalculate(userId: string, courseId: string) {
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
    return updated;
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
