import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { plans } from '@app/database/schemas/subscription/plan.schema';
import { planEntitlements } from '@app/database/schemas/subscription/plan-entitlement.schema';
import {
  CreatePlanRequestDTO,
  DeleteResponseDTO,
  DRIZZLE,
  IPlanService,
  type EntitlementKey,
  PlanResponseDTO,
  UpdatePlanRequestDTO,
} from '@app/contracts';
import { RpcConflictException, RpcNotFoundException } from '@app/common';

@Injectable()
export class PlanService implements IPlanService {
  private readonly logger = new Logger(PlanService.name);

  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

  async create(dto: CreatePlanRequestDTO): Promise<PlanResponseDTO> {
    await this.ensureSlugAvailable(dto.slug);
    const created = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(plans)
        .values({
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          price: dto.price.toFixed(2),
          billingPeriod: dto.billingPeriod,
          aiCredits: dto.aiCredits,
          stripePriceId: dto.stripePriceId,
          trialDays: dto.trialDays,
          gracePeriodDays: dto.gracePeriodDays,
        })
        .returning();
      if (dto.entitlements?.length) {
        await tx.insert(planEntitlements).values(
          [...new Set(dto.entitlements)].map((entitlement) => ({
            planId: row.id,
            entitlement,
          })),
        );
      }
      return row;
    });
    this.logger.log(`Plan created: ${created.slug}`);
    return this.toDTO(created, dto.entitlements ?? []);
  }

  async findAll(): Promise<PlanResponseDTO[]> {
    const rows = await this.db.select().from(plans).orderBy(plans.price);
    return Promise.all(rows.map((row) => this.withEntitlements(row)));
  }

  async findOne(id: string): Promise<PlanResponseDTO> {
    const [found] = await this.db
      .select()
      .from(plans)
      .where(eq(plans.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Plan not found');
    return this.withEntitlements(found);
  }

  async update(
    id: string,
    dto: UpdatePlanRequestDTO,
  ): Promise<PlanResponseDTO> {
    await this.findOne(id);
    if (dto.slug) await this.ensureSlugAvailable(dto.slug, id);
    const { price, entitlements, ...rest } = dto;
    const updated = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .update(plans)
        .set({
          ...rest,
          ...(price !== undefined ? { price: price.toFixed(2) } : {}),
          updatedAt: new Date(),
        })
        .where(eq(plans.id, id))
        .returning();
      if (entitlements !== undefined) {
        await tx
          .delete(planEntitlements)
          .where(eq(planEntitlements.planId, id));
        if (entitlements.length)
          await tx.insert(planEntitlements).values(
            [...new Set(entitlements)].map((entitlement) => ({
              planId: id,
              entitlement,
            })),
          );
      }
      return row;
    });
    return this.withEntitlements(updated);
  }

  async remove(id: string): Promise<DeleteResponseDTO> {
    const [deleted] = await this.db
      .delete(plans)
      .where(eq(plans.id, id))
      .returning({ id: plans.id });
    if (!deleted) throw new RpcNotFoundException('Plan not found');
    return new DeleteResponseDTO({ message: 'Plan deleted successfully', id });
  }

  /** Maps a plan row to its DTO, coercing the numeric `price` column. */
  private toDTO(
    row: typeof plans.$inferSelect,
    entitlements: EntitlementKey[],
  ): PlanResponseDTO {
    return new PlanResponseDTO({
      ...row,
      price: Number(row.price),
      entitlements,
    });
  }

  private async withEntitlements(
    row: typeof plans.$inferSelect,
  ): Promise<PlanResponseDTO> {
    const mappings = await this.db
      .select({ entitlement: planEntitlements.entitlement })
      .from(planEntitlements)
      .where(eq(planEntitlements.planId, row.id));
    return this.toDTO(
      row,
      mappings.map((item) => item.entitlement as EntitlementKey),
    );
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
