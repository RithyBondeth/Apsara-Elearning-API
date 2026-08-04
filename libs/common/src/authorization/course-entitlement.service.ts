import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { DRIZZLE, EntitlementKey } from '@app/contracts';
import { courses } from '@app/database/schemas/course/course.schema';
import { modules } from '@app/database/schemas/course/module.schema';
import { lessons } from '@app/database/schemas/course/lessons/lesson.schema';
import {
  RpcForbiddenException,
  RpcNotFoundException,
} from '../filters/rpc-exceptions';
import { EntitlementService } from './entitlement.service';

@Injectable()
export class CourseEntitlementService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    private readonly entitlements: EntitlementService,
  ) {}

  async assertPublishedCourse(courseId: string): Promise<void> {
    await this.courseAccess(courseId);
  }

  async assertPublishedModule(moduleId: string): Promise<void> {
    const [row] = await this.db
      .select({ published: courses.published })
      .from(modules)
      .innerJoin(courses, eq(modules.courseId, courses.id))
      .where(eq(modules.id, moduleId))
      .limit(1);
    if (!row?.published) throw new RpcNotFoundException('Module not found');
  }

  /**
   * Whether this caller may see lesson bodies for a course. Throws if the
   * course isn't published, so callers get a 404 rather than an empty outline.
   *
   * Resolving access once per course lets the outline endpoint gate every
   * lesson from a single check instead of one per module.
   */
  async canReadCourseContent(
    courseId: string,
    userId?: string,
  ): Promise<boolean> {
    const course = await this.courseAccess(courseId);
    return this.hasContentAccess(course, userId);
  }

  async canReadModuleContent(
    moduleId: string,
    userId?: string,
  ): Promise<boolean> {
    const [row] = await this.db
      .select({
        courseId: courses.id,
        published: courses.published,
        requiresSubscription: courses.requiresSubscription,
        requiredEntitlement: courses.requiredEntitlement,
      })
      .from(modules)
      .innerJoin(courses, eq(modules.courseId, courses.id))
      .where(eq(modules.id, moduleId))
      .limit(1);
    if (!row?.published) throw new RpcNotFoundException('Module not found');
    return this.hasContentAccess(row, userId);
  }

  async assertCanReadLesson(
    locator: { id: string } | { slug: string },
    userId?: string,
  ): Promise<void> {
    const condition =
      'id' in locator
        ? eq(lessons.id, locator.id)
        : eq(lessons.slug, locator.slug);
    const [row] = await this.db
      .select({
        courseId: courses.id,
        published: courses.published,
        requiresSubscription: courses.requiresSubscription,
        requiredEntitlement: courses.requiredEntitlement,
      })
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(courses, eq(modules.courseId, courses.id))
      .where(condition)
      .limit(1);
    if (!row?.published) throw new RpcNotFoundException('Lesson not found');
    if (!(await this.hasContentAccess(row, userId))) {
      throw new RpcForbiddenException(
        'An active subscription is required for this lesson',
      );
    }
  }

  async assertCanEnroll(userId: string, courseId: string): Promise<void> {
    const access = await this.courseAccess(courseId);
    if (!(await this.hasContentAccess(access, userId))) {
      throw new RpcForbiddenException(
        'An active subscription is required for this course',
      );
    }
  }

  private async courseAccess(courseId: string) {
    const [course] = await this.db
      .select({
        courseId: courses.id,
        published: courses.published,
        requiresSubscription: courses.requiresSubscription,
        requiredEntitlement: courses.requiredEntitlement,
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);
    if (!course?.published) throw new RpcNotFoundException('Course not found');
    return course;
  }

  private async hasContentAccess(
    course: {
      requiresSubscription: boolean;
      requiredEntitlement: string | null;
      courseId: string;
    },
    userId?: string,
  ): Promise<boolean> {
    const required =
      (course.requiredEntitlement as EntitlementKey | null) ??
      (course.requiresSubscription ? 'courses:premium' : null);
    if (!required) return true;
    if (!userId) return false;

    return this.entitlements.has(userId, required);
  }
}
