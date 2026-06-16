import { Inject, Injectable, Logger } from '@nestjs/common';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { eq, lte, sql } from 'drizzle-orm';
import { user } from '@app/database/schemas/user/user.schema';
import { badges } from '@app/database/schemas/user/badge.schema';
import { userBadges } from '@app/database/schemas/user/user-badge.schema';
import { DRIZZLE, UpdateUserRequestDTO } from '@app/contracts';
import { RpcNotFoundException } from '@app/common';

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
export class UserRpcService {
  private readonly logger = new Logger(UserRpcService.name);

  constructor(@Inject(DRIZZLE) private readonly db: NeonHttpDatabase<any>) {}

  findAll() {
    return this.db.select(publicColumns).from(user).orderBy(user.createdAt);
  }

  async findOne(id: string) {
    const [found] = await this.db
      .select(publicColumns)
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('User not found');
    return found;
  }

  async findByEmail(email: string) {
    const [found] = await this.db
      .select(publicColumns)
      .from(user)
      .where(eq(user.email, email))
      .limit(1);
    if (!found) throw new RpcNotFoundException('User not found');
    return found;
  }

  async update(id: string, dto: UpdateUserRequestDTO) {
    const [updated] = await this.db
      .update(user)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning(publicColumns);
    if (!updated) throw new RpcNotFoundException('User not found');
    this.logger.log(`User updated: ${id}`);
    return updated;
  }

  async updateAvatar(id: string, avatar: string) {
    const [updated] = await this.db
      .update(user)
      .set({ avatar, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning(publicColumns);
    if (!updated) throw new RpcNotFoundException('User not found');
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.db
      .delete(user)
      .where(eq(user.id, id))
      .returning({ id: user.id });
    if (!deleted) throw new RpcNotFoundException('User not found');
    this.logger.log(`User deleted: ${id}`);
    return { message: 'User deleted successfully', id };
  }

  async addXp(id: string, amount: number) {
    const [updated] = await this.db
      .update(user)
      .set({ xp: sql`${user.xp} + ${amount}`, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning(publicColumns);
    if (!updated) throw new RpcNotFoundException('User not found');

    const awarded = await this.awardEligibleBadges(id, updated.xp ?? 0);
    this.logger.log(`Added ${amount} XP to ${id} (total ${updated.xp})`);
    return { user: updated, awardedBadges: awarded };
  }

  async updateStreak(id: string, reset = false) {
    const [updated] = await this.db
      .update(user)
      .set({
        streak: reset ? 1 : sql`${user.streak} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(user.id, id))
      .returning(publicColumns);
    if (!updated) throw new RpcNotFoundException('User not found');
    return updated;
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
