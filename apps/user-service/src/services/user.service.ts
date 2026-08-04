import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, lte, sql } from 'drizzle-orm';
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
