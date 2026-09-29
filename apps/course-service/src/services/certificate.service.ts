import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { ClientProxy } from '@nestjs/microservices';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { certificates } from '@app/database/schemas/course/certificate.schema';
import { enrollments } from '@app/database/schemas/course/enrollment.schema';
import { courses } from '@app/database/schemas/course/course.schema';
import { user } from '@app/database/schemas/user/user.schema';
import {
  AdminCertificateDTO,
  CertificateResponseDTO,
  CertificateVerificationResponseDTO,
  DRIZZLE,
  USER_SERVICE,
} from '@app/contracts';
import {
  EntitlementService,
  notifyUser,
  RpcBadRequestException,
  RpcForbiddenException,
  RpcNotFoundException,
} from '@app/common';
import { generateCertificateCode, normalizeCertificateCode } from '@app/utils';

/** Retries on the (vanishingly unlikely) chance a generated code collides. */
const MAX_CODE_ATTEMPTS = 5;

/** The admin list is a search tool, not an export; cap what one query returns. */
const ADMIN_LIST_LIMIT = 200;

@Injectable()
export class CertificateService {
  private readonly logger = new Logger(CertificateService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    private readonly entitlements: EntitlementService,
    @Inject(USER_SERVICE.NAME) private readonly userClient: ClientProxy,
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

  /**
   * Admin search, newest first. `q` matches the code, the learner's name or
   * email, or the course title; without it this is the most recent issues.
   */
  async adminList(q?: string): Promise<AdminCertificateDTO[]> {
    const term = q?.trim();
    const like = term ? `%${term.replace(/[%_\\]/g, '\\$&')}%` : null;
    const rows = await this.adminSelect()
      .where(
        like
          ? or(
              ilike(certificates.code, like),
              ilike(user.email, like),
              ilike(courses.title, like),
              ilike(
                sql`concat_ws(' ', ${user.firstName}, ${user.lastName})`,
                like,
              ),
            )
          : undefined,
      )
      .orderBy(desc(certificates.issuedAt))
      .limit(ADMIN_LIST_LIMIT);
    return rows.map((row) => this.toAdminDTO(row));
  }

  /**
   * Withdraws a certificate. Public verification then reports it invalid, and
   * the holder is told why. Refuses to re-revoke rather than silently
   * replacing the recorded reason.
   */
  async revoke(
    id: string,
    actorId: string,
    reason: string,
  ): Promise<AdminCertificateDTO> {
    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      throw new RpcBadRequestException('Give a reason for revoking');
    }
    const row = await this.findById(id);
    if (row.certificate.revokedAt) {
      throw new RpcBadRequestException('Certificate is already revoked');
    }

    await this.db
      .update(certificates)
      .set({
        revokedAt: new Date(),
        revocationReason: trimmed,
        revokedBy: actorId,
        updatedAt: new Date(),
      })
      .where(eq(certificates.id, id));

    await notifyUser(
      this.userClient,
      {
        userId: row.certificate.userId,
        type: 'certificate_revoked',
        title: `Certificate withdrawn: ${row.course.title}`,
        body: `Reason: ${trimmed}`,
        data: { certificateId: id, courseId: row.certificate.courseId },
      },
      this.logger,
    );
    this.logger.log(
      `Certificate ${row.certificate.code} revoked by ${actorId}`,
    );
    return this.adminOne(id);
  }

  /** Undoes a revocation (e.g. one made in error) and tells the holder. */
  async reinstate(id: string, actorId: string): Promise<AdminCertificateDTO> {
    const row = await this.findById(id);
    if (!row.certificate.revokedAt) {
      throw new RpcBadRequestException('Certificate is not revoked');
    }

    await this.db
      .update(certificates)
      .set({
        revokedAt: null,
        revocationReason: null,
        revokedBy: null,
        updatedAt: new Date(),
      })
      .where(eq(certificates.id, id));

    await notifyUser(
      this.userClient,
      {
        userId: row.certificate.userId,
        type: 'certificate_issued',
        title: `Certificate reinstated: ${row.course.title}`,
        body: 'Your certificate is valid again.',
        data: { certificateId: id, courseId: row.certificate.courseId },
      },
      this.logger,
    );
    this.logger.log(
      `Certificate ${row.certificate.code} reinstated by ${actorId}`,
    );
    return this.adminOne(id);
  }

  private async findById(id: string) {
    const [row] = await this.db
      .select({ certificate: certificates, course: courses })
      .from(certificates)
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .where(eq(certificates.id, id))
      .limit(1);
    if (!row) throw new RpcNotFoundException('Certificate not found');
    return row;
  }

  private async adminOne(id: string): Promise<AdminCertificateDTO> {
    const [row] = await this.adminSelect()
      .where(eq(certificates.id, id))
      .limit(1);
    if (!row) throw new RpcNotFoundException('Certificate not found');
    return this.toAdminDTO(row);
  }

  /** A certificate with its holder and course, as the admin console lists it. */
  private adminSelect() {
    return this.db
      .select({
        certificate: certificates,
        courseTitle: courses.title,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      })
      .from(certificates)
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .innerJoin(user, eq(certificates.userId, user.id));
  }

  private toAdminDTO(row: {
    certificate: typeof certificates.$inferSelect;
    courseTitle: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  }): AdminCertificateDTO {
    return new AdminCertificateDTO({
      id: row.certificate.id,
      code: row.certificate.code,
      userId: row.certificate.userId,
      learnerName:
        [row.firstName, row.lastName].filter(Boolean).join(' ') || row.email,
      learnerEmail: row.email,
      courseId: row.certificate.courseId,
      courseTitle: row.courseTitle,
      issuedAt: row.certificate.issuedAt,
      revokedAt: row.certificate.revokedAt,
      revocationReason: row.certificate.revocationReason,
      revokedBy: row.certificate.revokedBy,
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
      revocationReason: certificate.revocationReason,
    });
  }
}
