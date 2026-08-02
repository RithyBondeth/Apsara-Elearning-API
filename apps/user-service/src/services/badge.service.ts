import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { badges } from '@app/database/schemas/user/badge.schema';
import { userBadges } from '@app/database/schemas/user/user-badge.schema';
import { user } from '@app/database/schemas/user/user.schema';
import {
  AwardBadgeResponseDTO,
  BadgeResponseDTO,
  CreateBadgeRequestDTO,
  DeleteResponseDTO,
  DRIZZLE,
  IBadgeService,
  UpdateBadgeRequestDTO,
  UserBadgeResponseDTO,
} from '@app/contracts';
import { RpcBadRequestException, RpcNotFoundException } from '@app/common';

@Injectable()
export class BadgeService implements IBadgeService {
  private readonly logger = new Logger(BadgeService.name);

  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

  async create(dto: CreateBadgeRequestDTO): Promise<BadgeResponseDTO> {
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
    return new BadgeResponseDTO(created);
  }

  async findAll(): Promise<BadgeResponseDTO[]> {
    const rows = await this.db.select().from(badges).orderBy(badges.xpRequired);
    return rows.map((row) => new BadgeResponseDTO(row));
  }

  async findOne(id: string): Promise<BadgeResponseDTO> {
    const [found] = await this.db
      .select()
      .from(badges)
      .where(eq(badges.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Badge not found');
    return new BadgeResponseDTO(found);
  }

  async update(
    id: string,
    dto: UpdateBadgeRequestDTO,
  ): Promise<BadgeResponseDTO> {
    const [updated] = await this.db
      .update(badges)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(badges.id, id))
      .returning();
    if (!updated) throw new RpcNotFoundException('Badge not found');
    return new BadgeResponseDTO(updated);
  }

  async remove(id: string): Promise<DeleteResponseDTO> {
    const [deleted] = await this.db
      .delete(badges)
      .where(eq(badges.id, id))
      .returning({ id: badges.id });
    if (!deleted) throw new RpcNotFoundException('Badge not found');
    return new DeleteResponseDTO({ message: 'Badge deleted successfully', id });
  }

  async award(userId: string, badgeId: string): Promise<AwardBadgeResponseDTO> {
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
    return new AwardBadgeResponseDTO(
      awarded ?? { userId, badgeId, alreadyOwned: true },
    );
  }

  async findByUser(userId: string): Promise<UserBadgeResponseDTO[]> {
    const rows = await this.db
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
    return rows.map((row) => new UserBadgeResponseDTO(row));
  }
}
