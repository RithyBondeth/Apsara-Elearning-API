import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, eq, gt, isNull, lte, or } from 'drizzle-orm';
import { DRIZZLE } from '@app/contracts';
import { courses } from '@app/database/schemas/course/course.schema';
import { modules } from '@app/database/schemas/course/module.schema';
import { lessons } from '@app/database/schemas/course/lessons/lesson.schema';
import { subscriptions } from '@app/database/schemas/subscription/subscription.schema';
import {
  RpcForbiddenException,
  RpcNotFoundException,
} from '../filters/rpc-exceptions';

@Injectable()
export class CourseEntitlementService {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

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

  async canReadModuleContent(
    moduleId: string,
    userId?: string,
  ): Promise<boolean> {
    const [row] = await this.db
      .select({
        courseId: courses.id,
        published: courses.published,
        requiresSubscription: courses.requiresSubscription,
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
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);
    if (!course?.published) throw new RpcNotFoundException('Course not found');
    return course;
  }

  private async hasContentAccess(
    course: { requiresSubscription: boolean; courseId: string },
    userId?: string,
  ): Promise<boolean> {
    if (!course.requiresSubscription) return true;
    if (!userId) return false;

    const [active] = await this.db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.active, true),
          or(
            isNull(subscriptions.startsAt),
            lte(subscriptions.startsAt, new Date()),
          ),
          or(
            isNull(subscriptions.expiresAt),
            gt(subscriptions.expiresAt, new Date()),
          ),
        ),
      )
      .limit(1);
    return !!active;
  }
}
