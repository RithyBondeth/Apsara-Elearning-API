import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, desc, eq } from 'drizzle-orm';
import { certificates } from '@app/database/schemas/course/certificate.schema';
import { enrollments } from '@app/database/schemas/course/enrollment.schema';
import { courses } from '@app/database/schemas/course/course.schema';
import { user } from '@app/database/schemas/user/user.schema';
import {
  CertificateResponseDTO,
  CertificateVerificationResponseDTO,
  DRIZZLE,
} from '@app/contracts';
import {
  EntitlementService,
  RpcBadRequestException,
  RpcForbiddenException,
  RpcNotFoundException,
} from '@app/common';
import { generateCertificateCode, normalizeCertificateCode } from '@app/utils';

/** Retries on the (vanishingly unlikely) chance a generated code collides. */
const MAX_CODE_ATTEMPTS = 5;

@Injectable()
export class CertificateService {
  private readonly logger = new Logger(CertificateService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    private readonly entitlements: EntitlementService,
  ) {}

  /**
   * Issues the learner's certificate for a completed course, or returns the one
   * they already hold.
   *
   * Idempotent by design: this is called both automatically when a course is
   * finished and explicitly when a learner claims a certificate for a course
   * they completed before subscribing.
   */
  async issue(
    userId: string,
    courseId: string,
  ): Promise<CertificateResponseDTO> {
    const existing = await this.findRow(userId, courseId);
    if (existing) return this.toDTO(existing.certificate, existing.course);

    const [enrollment] = await this.db
      .select({ completed: enrollments.completed })
      .from(enrollments)
      .where(
        and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
      )
      .limit(1);

    if (!enrollment) {
      throw new RpcNotFoundException('You are not enrolled in this course');
    }
    if (!enrollment.completed) {
      throw new RpcBadRequestException(
        'Finish every lesson in this course to earn its certificate',
      );
    }

    // Checked at issue time rather than at download: the certificate is the
    // artefact being sold, so it should not exist unless it was paid for.
    if (!(await this.entitlements.has(userId, 'certificates'))) {
      throw new RpcForbiddenException(
        'A plan including certificates is required',
      );
    }

    const [course] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);
    if (!course) throw new RpcNotFoundException('Course not found');

    const row = await this.insertWithUniqueCode(userId, courseId);
    this.logger.log(
      `Certificate ${row.code} issued to ${userId} (${courseId})`,
    );
    return this.toDTO(row, course);
  }

  async findByUser(userId: string): Promise<CertificateResponseDTO[]> {
    const rows = await this.db
      .select({ certificate: certificates, course: courses })
      .from(certificates)
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .where(eq(certificates.userId, userId))
      .orderBy(desc(certificates.issuedAt));
    return rows.map((row) => this.toDTO(row.certificate, row.course));
  }

  /**
   * Public verification. Never throws for an unknown code — an employer typing
   * a code in gets `valid: false`, and a 404 vs 200 difference would let anyone
   * probe which codes exist.
   */
  async verify(code: string): Promise<CertificateVerificationResponseDTO> {
    const normalized = normalizeCertificateCode(code);
    if (!normalized) {
      return new CertificateVerificationResponseDTO({
        code: code.trim().toUpperCase(),
        valid: false,
      });
    }

    const [row] = await this.db
      .select({
        certificate: certificates,
        course: courses,
        firstName: user.firstName,
        lastName: user.lastName,
      })
      .from(certificates)
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .innerJoin(user, eq(certificates.userId, user.id))
      .where(eq(certificates.code, normalized))
      .limit(1);

    if (!row) {
      return new CertificateVerificationResponseDTO({
        code: normalized,
        valid: false,
      });
    }

    return new CertificateVerificationResponseDTO({
      code: row.certificate.code,
      valid: !row.certificate.revokedAt,
      learnerName:
        [row.firstName, row.lastName].filter(Boolean).join(' ') || 'Learner',
      courseTitle: row.course.title,
      courseTitleKm: row.course.titleKm,
      issuedAt: row.certificate.issuedAt,
      revokedAt: row.certificate.revokedAt,
    });
  }

  private async findRow(userId: string, courseId: string) {
    const [row] = await this.db
      .select({ certificate: certificates, course: courses })
      .from(certificates)
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .where(
        and(
          eq(certificates.userId, userId),
          eq(certificates.courseId, courseId),
        ),
      )
      .limit(1);
    return row;
  }

  /**
   * Inserts with a fresh code, retrying on a unique-violation.
   *
   * The (user, course) pair is also unique, so a concurrent double-issue
   * resolves to the row that landed first rather than a second certificate.
   */
  private async insertWithUniqueCode(userId: string, courseId: string) {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const [inserted] = await this.db
        .insert(certificates)
        .values({ userId, courseId, code: generateCertificateCode() })
        .onConflictDoNothing()
        .returning();
      if (inserted) return inserted;

      const existing = await this.findRow(userId, courseId);
      if (existing) return existing.certificate;
      // Otherwise the code collided; loop and generate another.
    }
    throw new RpcBadRequestException('Could not allocate a certificate code');
  }

  private toDTO(
    certificate: typeof certificates.$inferSelect,
    course: typeof courses.$inferSelect,
  ): CertificateResponseDTO {
    return new CertificateResponseDTO({
      id: certificate.id,
      courseId: certificate.courseId,
      code: certificate.code,
      courseTitle: course.title,
      courseTitleKm: course.titleKm,
      courseSlug: course.slug,
      issuedAt: certificate.issuedAt,
      revokedAt: certificate.revokedAt,
    });
  }
}
