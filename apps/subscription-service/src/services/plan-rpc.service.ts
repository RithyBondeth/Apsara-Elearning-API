import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { plans } from '@app/database/schemas/subscription/plan.schema';
import {
  CreatePlanRequestDTO,
  DRIZZLE,
  UpdatePlanRequestDTO,
} from '@app/contracts';
import { RpcConflictException, RpcNotFoundException } from '@app/common';

@Injectable()
export class PlanRpcService {
  private readonly logger = new Logger(PlanRpcService.name);

  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

  async create(dto: CreatePlanRequestDTO) {
    await this.ensureSlugAvailable(dto.slug);
    const [created] = await this.db
      .insert(plans)
      .values({
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        price: dto.price.toFixed(2),
        billingPeriod: dto.billingPeriod,
        aiCredits: dto.aiCredits,
      })
      .returning();
    this.logger.log(`Plan created: ${created.slug}`);
    return created;
  }

  findAll() {
    return this.db.select().from(plans).orderBy(plans.price);
  }

  async findOne(id: string) {
    const [found] = await this.db
      .select()
      .from(plans)
      .where(eq(plans.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Plan not found');
    return found;
  }

  async update(id: string, dto: UpdatePlanRequestDTO) {
    await this.findOne(id);
    if (dto.slug) await this.ensureSlugAvailable(dto.slug, id);
    const { price, ...rest } = dto;
    const [updated] = await this.db
      .update(plans)
      .set({
        ...rest,
        ...(price !== undefined ? { price: price.toFixed(2) } : {}),
        updatedAt: new Date(),
      })
      .where(eq(plans.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.db
      .delete(plans)
      .where(eq(plans.id, id))
      .returning({ id: plans.id });
    if (!deleted) throw new RpcNotFoundException('Plan not found');
    return { message: 'Plan deleted successfully', id };
  }

  private async ensureSlugAvailable(slug: string, exceptId?: string) {
    const [existing] = await this.db
      .select()
      .from(plans)
      .where(eq(plans.slug, slug))
      .limit(1);
    if (existing && existing.id !== exceptId) {
      throw new RpcConflictException('Plan with this slug already exists');
    }
  }
}
