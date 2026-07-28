import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, eq } from 'drizzle-orm';
import { enrollments } from '@app/database/schemas/course/enrollment.schema';
import { courses } from '@app/database/schemas/course/course.schema';
import {
  DRIZZLE,
  EnrollmentResponseDTO,
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
