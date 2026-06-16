import { Inject, Injectable, Logger } from '@nestjs/common';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { categories } from '@app/database/schemas/course/category.schema';
import {
  CreateCategoryRequestDTO,
  DRIZZLE,
  UpdateCategoryRequestDTO,
} from '@app/contracts';
import { RpcConflictException, RpcNotFoundException } from '@app/common';

@Injectable()
export class CategoryRpcService {
  private readonly logger = new Logger(CategoryRpcService.name);

  constructor(@Inject(DRIZZLE) private readonly db: NeonHttpDatabase<any>) {}

  async create(dto: CreateCategoryRequestDTO) {
    await this.ensureSlugAvailable(dto.slug);
    const [created] = await this.db
      .insert(categories)
      .values({
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        icon: dto.icon,
      })
      .returning();
    this.logger.log(`Category created: ${created.slug}`);
    return created;
  }

  findAll() {
    return this.db.select().from(categories).orderBy(categories.name);
  }

  async findOne(id: string) {
    const [found] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Category not found');
    return found;
  }

  async findBySlug(slug: string) {
    const [found] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Category not found');
    return found;
  }

  async update(id: string, dto: UpdateCategoryRequestDTO) {
    await this.findOne(id);
    if (dto.slug) await this.ensureSlugAvailable(dto.slug, id);
    const [updated] = await this.db
      .update(categories)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    this.logger.log(`Category updated: ${id}`);
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();
    if (!deleted) throw new RpcNotFoundException('Category not found');
    this.logger.log(`Category deleted: ${id}`);
    return { message: 'Category deleted successfully', id };
  }

  private async ensureSlugAvailable(slug: string, exceptId?: string) {
    const [existing] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);
    if (existing && existing.id !== exceptId) {
      throw new RpcConflictException('Category with this slug already exists');
    }
  }
}
