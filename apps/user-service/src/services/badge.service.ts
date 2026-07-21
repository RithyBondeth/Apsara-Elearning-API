import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { badges } from '@app/database/schemas/user/badge.schema';
import { userBadges } from '@app/database/schemas/user/user-badge.schema';
import { user } from '@app/database/schemas/user/user.schema';
import {
  CreateBadgeRequestDTO,
  DRIZZLE,
  UpdateBadgeRequestDTO,
} from '@app/contracts';
import { RpcBadRequestException, RpcNotFoundException } from '@app/common';

@Injectable()
export class BadgeService {
  private readonly logger = new Logger(BadgeService.name);

  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

  async create(dto: CreateBadgeRequestDTO) {
    const [created] = await this.db
      .insert(badges)
      .values({
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        xpRequired: dto.xpRequired,
      })
      .returning();
    this.logger.log(`Badge created: ${created.name}`);
    return created;
  }

  findAll() {
    return this.db.select().from(badges).orderBy(badges.xpRequired);
  }

  async findOne(id: string) {
    const [found] = await this.db
      .select()
      .from(badges)
      .where(eq(badges.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Badge not found');
    return found;
  }

  async update(id: string, dto: UpdateBadgeRequestDTO) {
    const [updated] = await this.db
      .update(badges)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(badges.id, id))
      .returning();
    if (!updated) throw new RpcNotFoundException('Badge not found');
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.db
      .delete(badges)
      .where(eq(badges.id, id))
      .returning({ id: badges.id });
    if (!deleted) throw new RpcNotFoundException('Badge not found');
    return { message: 'Badge deleted successfully', id };
  }

  async award(userId: string, badgeId: string) {
    const [u] = await this.db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    if (!u) throw new RpcBadRequestException('User does not exist');

    await this.findOne(badgeId); // 404 if badge missing

    const [awarded] = await this.db
      .insert(userBadges)
      .values({ userId, badgeId })
      .onConflictDoNothing()
      .returning();
    this.logger.log(`Badge ${badgeId} awarded to ${userId}`);
    return awarded ?? { userId, badgeId, alreadyOwned: true };
  }

  findByUser(userId: string) {
    return this.db
      .select({
        badgeId: badges.id,
        name: badges.name,
        description: badges.description,
        icon: badges.icon,
        xpRequired: badges.xpRequired,
        earnedAt: userBadges.earnedAt,
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId))
      .orderBy(userBadges.earnedAt);
  }
}
