import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { desc, eq } from 'drizzle-orm';
import { DRIZZLE } from '@app/contracts';
import { lessonProgress } from '@app/database/schemas/course/lessons/lesson-progress.schema';
import { lessons } from '@app/database/schemas/course/lessons/lesson.schema';
import { modules } from '@app/database/schemas/course/module.schema';
import { courses } from '@app/database/schemas/course/course.schema';
import { subjects } from '@app/database/schemas/course/subject.schema';
import { gradeLevels } from '@app/database/schemas/course/grade-level.schema';

/** What the student is currently studying, used to ground the tutor's replies. */
export interface LessonContext {
  lessonTitle: string;
  moduleTitle: string | null;
  courseTitle: string;
  courseTitleKm: string | null;
  subjectName: string | null;
  subjectNameKm: string | null;
  gradeName: string | null;
  gradeNameKm: string | null;
  completed: boolean;
}

@Injectable()
export class LessonContextService {
  private readonly logger = new Logger(LessonContextService.name);

  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

  /**
   * Resolve the lesson the student most recently touched.
   *
   * Ordered by `updatedAt` rather than `createdAt` so revisiting an older
   * lesson moves it back to the front. Returns null when the student has no
   * progress yet — the tutor then falls back to its general prompt.
   */
  async findCurrent(userId: string): Promise<LessonContext | null> {
    try {
      const [row] = await this.db
        .select({
          lessonTitle: lessons.title,
          moduleTitle: modules.title,
          courseTitle: courses.title,
          courseTitleKm: courses.titleKm,
          subjectName: subjects.name,
          subjectNameKm: subjects.nameKm,
          gradeName: gradeLevels.name,
          gradeNameKm: gradeLevels.nameKm,
          completed: lessonProgress.completed,
        })
        .from(lessonProgress)
        .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
        .innerJoin(modules, eq(lessons.moduleId, modules.id))
        .innerJoin(courses, eq(modules.courseId, courses.id))
        .leftJoin(subjects, eq(courses.subjectId, subjects.id))
        .leftJoin(gradeLevels, eq(courses.gradeLevelId, gradeLevels.id))
        .where(eq(lessonProgress.userId, userId))
        .orderBy(desc(lessonProgress.updatedAt))
        .limit(1);

      if (!row) return null;

      return { ...row, completed: row.completed ?? false };
    } catch (error) {
      // Context is an enhancement, never a hard dependency — a failure here
      // must not block the student's reply.
      this.logger.warn(
        `Could not resolve lesson context for ${userId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }
}
