import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, asc, desc, eq, gt, lte, sql } from 'drizzle-orm';
import { user } from '@app/database/schemas/user/user.schema';
import { badges } from '@app/database/schemas/user/badge.schema';
import { userBadges } from '@app/database/schemas/user/user-badge.schema';
import {
  AddXpResponseDTO,
  AVATAR_PRESETS,
  BadgeResponseDTO,
  DeleteResponseDTO,
  DRIZZLE,
  IUserService,
  LeaderboardEntryDTO,
  LeaderboardResponseDTO,
  TAvatarPreset,
  UpdateUserRequestDTO,
  UserResponseDTO,
} from '@app/contracts';
import { RpcBadRequestException, RpcNotFoundException } from '@app/common';

/**
 * Columns safe to return to clients — never expose password, tokens, or OTPs.
 */
const publicColumns = {
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  gender: user.gender,
  dateOfBirth: user.dateOfBirth,
  avatar: user.avatar,
  streak: user.streak,
  xp: user.xp,
  isAdmin: user.isAdmin,
  email: user.email,
  isEmailVerified: user.isEmailVerified,
  phone: user.phone,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
};

@Injectable()
export class UserService implements IUserService {
  private readonly logger = new Logger(UserService.name);

  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

  async findAll(): Promise<UserResponseDTO[]> {
    const rows = await this.db
      .select(publicColumns)
      .from(user)
      .orderBy(user.createdAt);
    return rows.map((row) => new UserResponseDTO(row));
  }

  async findOne(id: string): Promise<UserResponseDTO> {
    const [found] = await this.db
      .select(publicColumns)
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('User not found');
    return new UserResponseDTO(found);
  }

  async findByEmail(email: string): Promise<UserResponseDTO> {
    const [found] = await this.db
      .select(publicColumns)
      .from(user)
      .where(eq(user.email, email))
      .limit(1);
    if (!found) throw new RpcNotFoundException('User not found');
    return new UserResponseDTO(found);
  }

  async update(
    id: string,
    dto: UpdateUserRequestDTO,
  ): Promise<UserResponseDTO> {
    const [updated] = await this.db
      .update(user)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning(publicColumns);
    if (!updated) throw new RpcNotFoundException('User not found');
    this.logger.log(`User updated: ${id}`);
    return new UserResponseDTO(updated);
  }

  async updateAvatar(
    id: string,
    avatar: TAvatarPreset,
  ): Promise<UserResponseDTO> {
    // The gateway DTO already checks this, but the action is callable over RPC
    // by any service — the column is free text, so guard the write itself.
    if (!AVATAR_PRESETS.includes(avatar)) {
      throw new RpcBadRequestException(
        `Unknown avatar '${avatar}'. Expected one of: ${AVATAR_PRESETS.join(', ')}`,
      );
    }

    const [updated] = await this.db
      .update(user)
      .set({ avatar, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning(publicColumns);
    if (!updated) throw new RpcNotFoundException('User not found');
    this.logger.log(`Avatar updated: ${id} -> ${avatar}`);
    return new UserResponseDTO(updated);
  }

  async remove(id: string): Promise<DeleteResponseDTO> {
    const [deleted] = await this.db
      .delete(user)
      .where(eq(user.id, id))
      .returning({ id: user.id });
    if (!deleted) throw new RpcNotFoundException('User not found');
    this.logger.log(`User deleted: ${id}`);
    return new DeleteResponseDTO({ message: 'User deleted successfully', id });
  }

  async addXp(id: string, amount: number): Promise<AddXpResponseDTO> {
    const [updated] = await this.db
      .update(user)
      .set({ xp: sql`${user.xp} + ${amount}`, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning(publicColumns);
    if (!updated) throw new RpcNotFoundException('User not found');

    const awarded = await this.awardEligibleBadges(id, updated.xp ?? 0);
    this.logger.log(`Added ${amount} XP to ${id} (total ${updated.xp})`);
    return new AddXpResponseDTO({
      user: new UserResponseDTO(updated),
      awardedBadges: awarded.map((badge) => new BadgeResponseDTO(badge)),
    });
  }

  /**
   * Stores an already-computed streak.
   *
   * Takes an absolute value rather than incrementing: course-service owns the
   * completion history and recomputes the true streak from it, so this stays
   * idempotent — two lessons finished on the same day can't inflate it, and a
   * returning learner's broken streak is corrected rather than resumed.
   */
  async updateStreak(id: string, streak: number): Promise<UserResponseDTO> {
    // RPC payloads are untyped on the wire; a NaN here would reach the column.
    if (!Number.isFinite(streak)) {
      throw new RpcBadRequestException('Streak must be a number');
    }
    const [updated] = await this.db
      .update(user)
      .set({ streak: Math.max(0, Math.trunc(streak)), updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning(publicColumns);
    if (!updated) throw new RpcNotFoundException('User not found');
    return new UserResponseDTO(updated);
  }

  /**
   * XP leaderboard: the top `limit` learners plus the viewer's own row.
   *
   * Ranking is competition-style via `rank()`, so tied XP shares a rank. The
   * viewer's rank is derived the same way — a count of learners strictly ahead
   * of them, plus one — so a viewer outside the page gets a number consistent
   * with the rows above.
   *
   * Admins are excluded: they are staff, not competitors, and seeding content
   * should not put them at the top of a student board.
   */
  async leaderboard(
    viewerId: string,
    limit: number,
  ): Promise<LeaderboardResponseDTO> {
    const ranked = await this.db
      .select({
        rank: sql<number>`rank() over (order by coalesce(${user.xp}, 0) desc)`,
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        xp: user.xp,
        streak: user.streak,
      })
      .from(user)
      .where(eq(user.isAdmin, false))
      .orderBy(desc(user.xp), asc(user.createdAt))
      .limit(limit);

    const [counted] = await this.db
      .select({ total: sql<number>`count(*)` })
      .from(user)
      .where(eq(user.isAdmin, false));
    const total = Number(counted?.total ?? 0);

    const entries = ranked.map((row) => this.toLeaderboardEntry(row, viewerId));

    // Reuse the viewer's row when they are already on the page; otherwise look
    // up just their standing rather than paging the whole board.
    const onPage = entries.find((entry) => entry.isViewer) ?? null;
    const me = onPage ?? (await this.viewerStanding(viewerId));

    return new LeaderboardResponseDTO({ entries, me, total });
  }

  /** The viewer's own row when they fall outside the returned page. */
  private async viewerStanding(
    viewerId: string,
  ): Promise<LeaderboardEntryDTO | null> {
    const [viewer] = await this.db
      .select({
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        xp: user.xp,
        streak: user.streak,
        isAdmin: user.isAdmin,
      })
      .from(user)
      .where(eq(user.id, viewerId))
      .limit(1);

    // An admin (or a deleted account) has no place on the board.
    if (!viewer || viewer.isAdmin) return null;

    const [ahead] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(
        and(
          eq(user.isAdmin, false),
          gt(sql`coalesce(${user.xp}, 0)`, viewer.xp ?? 0),
        ),
      );

    return this.toLeaderboardEntry(
      { ...viewer, rank: Number(ahead?.count ?? 0) + 1 },
      viewerId,
    );
  }

  /**
   * Board rows carry a short display name — first name plus last initial — and
   * never an email. Learners here include children, so a board other learners
   * can read must not expose anything that identifies them off-platform.
   */
  private toLeaderboardEntry(
    row: {
      rank: number | string;
      userId: string;
      firstName: string | null;
      lastName: string | null;
      avatar: string | null;
      xp: number | null;
      streak: number | null;
    },
    viewerId: string,
  ): LeaderboardEntryDTO {
    const initial = row.lastName?.trim()?.[0];
    const displayName =
      [row.firstName?.trim(), initial ? `${initial}.` : null]
        .filter(Boolean)
        .join(' ') || 'Learner';

    return new LeaderboardEntryDTO({
      rank: Number(row.rank),
      userId: row.userId,
      displayName,
      avatar: row.avatar ?? null,
      xp: row.xp ?? 0,
      streak: row.streak ?? 0,
      isViewer: row.userId === viewerId,
    });
  }

  /** Awards any XP-threshold badge the user has now earned but doesn't hold. */
  private async awardEligibleBadges(userId: string, xp: number) {
    const eligible = await this.db
      .select()
      .from(badges)
      .where(lte(badges.xpRequired, xp));
    if (eligible.length === 0) return [];

    const held = await this.db
      .select({ badgeId: userBadges.badgeId })
      .from(userBadges)
      .where(eq(userBadges.userId, userId));
    const heldIds = new Set(held.map((h) => h.badgeId));

    const toAward = eligible.filter((b) => !heldIds.has(b.id));
    for (const badge of toAward) {
      await this.db
        .insert(userBadges)
        .values({ userId, badgeId: badge.id })
        .onConflictDoNothing();
      this.logger.log(`Badge "${badge.name}" awarded to ${userId}`);
    }
    return toAward;
  }
}
