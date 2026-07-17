import { Inject, Injectable, Logger } from '@nestjs/common';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { programmingCategories } from '@app/database/schemas/course/programming-category.schema';
import {
  CreateProgrammingCategoryRequestDTO,
  DRIZZLE,
  UpdateProgrammingCategoryRequestDTO,
} from '@app/contracts';
import { RpcConflictException, RpcNotFoundException } from '@app/common';

@Injectable()
export class ProgrammingCategoryRpcService {
  private readonly logger = new Logger(ProgrammingCategoryRpcService.name);

  constructor(@Inject(DRIZZLE) private readonly db: NeonHttpDatabase<any>) {}

  async create(dto: CreateProgrammingCategoryRequestDTO) {
    await this.ensureSlugAvailable(dto.slug);
    const [created] = await this.db
      .insert(programmingCategories)
      .values({
        name: dto.name,
        nameKm: dto.nameKm,
        slug: dto.slug,
        description: dto.description,
        descriptionKm: dto.descriptionKm,
        icon: dto.icon,
      })
      .returning();
    this.logger.log(`Programming category created: ${created.slug}`);
    return created;
  }

  findAll() {
    return this.db
      .select()
      .from(programmingCategories)
      .orderBy(programmingCategories.name);
  }

  async findOne(id: string) {
    const [found] = await this.db
      .select()
      .from(programmingCategories)
      .where(eq(programmingCategories.id, id))
      .limit(1);
    if (!found)
      throw new RpcNotFoundException('Programming category not found');
    return found;
  }

  async findBySlug(slug: string) {
    const [found] = await this.db
      .select()
      .from(programmingCategories)
      .where(eq(programmingCategories.slug, slug))
      .limit(1);
    if (!found)
      throw new RpcNotFoundException('Programming category not found');
    return found;
  }

  async update(id: string, dto: UpdateProgrammingCategoryRequestDTO) {
    await this.findOne(id);
    if (dto.slug) await this.ensureSlugAvailable(dto.slug, id);
    const [updated] = await this.db
      .update(programmingCategories)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(programmingCategories.id, id))
      .returning();
    this.logger.log(`Programming category updated: ${id}`);
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.db
      .delete(programmingCategories)
      .where(eq(programmingCategories.id, id))
      .returning();
    if (!deleted) {
      throw new RpcNotFoundException('Programming category not found');
    }
    this.logger.log(`Programming category deleted: ${id}`);
    return { message: 'Programming category deleted successfully', id };
  }

  private async ensureSlugAvailable(slug: string, exceptId?: string) {
    const [existing] = await this.db
      .select()
      .from(programmingCategories)
      .where(eq(programmingCategories.slug, slug))
      .limit(1);
    if (existing && existing.id !== exceptId) {
      throw new RpcConflictException(
        'Programming category with this slug already exists',
      );
    }
  }
}
