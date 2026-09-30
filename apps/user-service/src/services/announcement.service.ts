import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, desc, eq, isNull, SQL, sql } from 'drizzle-orm';
import { user } from '@app/database/schemas/user/user.schema';
import { announcements } from '@app/database/schemas/user/announcement.schema';
import { courses } from '@app/database/schemas/course/course.schema';
import {
  AnnouncementAudienceDTO,
  AnnouncementPreviewResponseDTO,
  AnnouncementResponseDTO,
  CreateAnnouncementRequestDTO,
  DRIZZLE,
} from '@app/contracts';
import { RpcBadRequestException, RpcNotFoundException } from '@app/common';

/** History is a record for admins, not an archive; show the latest. */
const HISTORY_LIMIT = 100;

/**
 * Admin announcements: one message, delivered as a notification to every
 * learner in an audience.
 *
 * The audience is resolved in SQL and the notifications are written with a
 * single INSERT … SELECT, so sending to every learner is one statement rather
 * than one round trip per learner. The announcement row and its notifications
 * are written in one transaction — a failure leaves neither behind.
 */
@Injectable()
export class AnnouncementService {
  private readonly logger = new Logger(AnnouncementService.name);

  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

  async preview(
    audience: AnnouncementAudienceDTO,
  ): Promise<AnnouncementPreviewResponseDTO> {
    await this.assertCourse(audience);
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(user)
      .where(this.recipients(audience));
    return new AnnouncementPreviewResponseDTO({ recipients: row?.count ?? 0 });
  }

  async send(
    actorId: string,
    dto: CreateAnnouncementRequestDTO,
  ): Promise<AnnouncementResponseDTO> {
    const title = dto.title.trim();
    const body = dto.body.trim();
    if (!title || !body) {
      throw new RpcBadRequestException(
        'An announcement needs a title and a message',
      );
    }
    const course = await this.assertCourse(dto);

    const id = await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(announcements)
        .values({
          title,
          body,
          audience: dto.audience,
          courseId: dto.audience === 'course' ? dto.courseId! : null,
          subscribersOnly: dto.subscribersOnly ?? false,
          sentBy: actorId,
        })
        .returning({ id: announcements.id });

      // A course announcement links to its course; a general one leads nowhere.
      const data = {
        announcementId: created.id,
        ...(course ? { courseSlug: course.slug } : {}),
      };
      const inserted = await tx.execute(sql`
        INSERT INTO notifications (user_id, type, title, body, data)
        SELECT ${user.id}, 'announcement', ${title}, ${body},
               ${JSON.stringify(data)}::jsonb
        FROM ${user}
        WHERE ${this.recipients(dto)}`);
      const recipientCount = Number(
        (inserted as unknown as { count?: number }).count ?? 0,
      );

      if (recipientCount === 0) {
        // Rolls back the announcement row too: nothing was delivered.
        throw new RpcBadRequestException(
          'No learners match this audience — nothing was sent',
        );
      }
      await tx
        .update(announcements)
        .set({ recipientCount })
        .where(eq(announcements.id, created.id));
      return created.id;
    });

    const [sent] = await this.findRows(eq(announcements.id, id));
    this.logger.log(
      `Announcement ${id} sent by ${actorId} to ${sent.recipientCount} learner(s)`,
    );
    return sent;
  }

  async findAll(): Promise<AnnouncementResponseDTO[]> {
    return this.findRows();
  }

  /**
   * Who an announcement reaches. Always: learners (not admins) who can
   * actually sign in and read it — not suspended, not waiting to be deleted,
   * email verified. Then narrowed by course enrolment and, optionally, an
   * active subscription (the same time window EntitlementService uses for a
   * plan: active, started, and not past its period, trial or grace).
   */
  private recipients(audience: AnnouncementAudienceDTO): SQL {
    const conditions: SQL[] = [
      eq(user.isAdmin, false),
      isNull(user.suspendedAt),
      isNull(user.deletionRequestedAt),
      eq(user.isEmailVerified, true),
    ];
    if (audience.audience === 'course') {
      conditions.push(sql`EXISTS (
        SELECT 1 FROM enrollments e
        WHERE e.user_id = ${user.id} AND e.course_id = ${audience.courseId})`);
    }
    if (audience.subscribersOnly) {
      conditions.push(sql`EXISTS (
        SELECT 1 FROM subscriptions s
        WHERE s.user_id = ${user.id}
          AND s.active = true
          AND (s.starts_at IS NULL OR s.starts_at <= now())
          AND (
            s.grace_ends_at > now()
            OR (s.status = 'trialing' AND s.trial_ends_at > now())
            OR (s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > now()))
          ))`);
    }
    return and(...conditions)!;
  }

  /** The course a course-audience announcement targets; 404 if it's gone. */
  private async assertCourse(audience: AnnouncementAudienceDTO) {
    if (audience.audience !== 'course') return null;
    if (!audience.courseId) {
      throw new RpcBadRequestException('Choose a course for this announcement');
    }
    const [course] = await this.db
      .select({ id: courses.id, slug: courses.slug })
      .from(courses)
      .where(eq(courses.id, audience.courseId))
      .limit(1);
    if (!course) throw new RpcNotFoundException('Course not found');
    return course;
  }

  private async findRows(where?: SQL): Promise<AnnouncementResponseDTO[]> {
    const rows = await this.db
      .select({
        announcement: announcements,
        courseTitle: courses.title,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      })
      .from(announcements)
      .leftJoin(courses, eq(announcements.courseId, courses.id))
      .leftJoin(user, eq(announcements.sentBy, user.id))
      .where(where)
      .orderBy(desc(announcements.createdAt))
      .limit(HISTORY_LIMIT);

    return rows.map(
      (row) =>
        new AnnouncementResponseDTO({
          id: row.announcement.id,
          title: row.announcement.title,
          body: row.announcement.body,
          audience: row.announcement.audience,
          courseId: row.announcement.courseId,
          courseTitle: row.courseTitle ?? null,
          subscribersOnly: row.announcement.subscribersOnly,
          recipientCount: row.announcement.recipientCount,
          sentByName: row.email
            ? [row.firstName, row.lastName].filter(Boolean).join(' ') ||
              row.email
            : null,
          createdAt: row.announcement.createdAt,
        }),
    );
  }
}
