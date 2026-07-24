import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { programmingCategories } from '@app/database/schemas/course/programming-category.schema';
import {
  CreateProgrammingCategoryRequestDTO,
  DeleteResponseDTO,
  DRIZZLE,
  IProgrammingCategoryService,
  ProgrammingCategoryResponseDTO,
  UpdateProgrammingCategoryRequestDTO,
} from '@app/contracts';
import { RpcConflictException, RpcNotFoundException } from '@app/common';

@Injectable()
export class ProgrammingCategoryService implements IProgrammingCategoryService {
  private readonly logger = new Logger(ProgrammingCategoryService.name);

  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

  async create(
    dto: CreateProgrammingCategoryRequestDTO,
  ): Promise<ProgrammingCategoryResponseDTO> {
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
    return new ProgrammingCategoryResponseDTO(created);
  }

  async findAll(): Promise<ProgrammingCategoryResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(programmingCategories)
      .orderBy(programmingCategories.name);
    return rows.map((row) => new ProgrammingCategoryResponseDTO(row));
  }

  async findOne(id: string): Promise<ProgrammingCategoryResponseDTO> {
    const [found] = await this.db
      .select()
      .from(programmingCategories)
      .where(eq(programmingCategories.id, id))
      .limit(1);
    if (!found)
      throw new RpcNotFoundException('Programming category not found');
    return new ProgrammingCategoryResponseDTO(found);
  }

  async findBySlug(slug: string): Promise<ProgrammingCategoryResponseDTO> {
    const [found] = await this.db
      .select()
      .from(programmingCategories)
      .where(eq(programmingCategories.slug, slug))
      .limit(1);
    if (!found)
      throw new RpcNotFoundException('Programming category not found');
    return new ProgrammingCategoryResponseDTO(found);
  }

  async update(
    id: string,
    dto: UpdateProgrammingCategoryRequestDTO,
  ): Promise<ProgrammingCategoryResponseDTO> {
    await this.findOne(id);
    if (dto.slug) await this.ensureSlugAvailable(dto.slug, id);
    const [updated] = await this.db
      .update(programmingCategories)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(programmingCategories.id, id))
      .returning();
    this.logger.log(`Programming category updated: ${id}`);
    return new ProgrammingCategoryResponseDTO(updated);
  }

  async remove(id: string): Promise<DeleteResponseDTO> {
    const [deleted] = await this.db
      .delete(programmingCategories)
      .where(eq(programmingCategories.id, id))
      .returning();
    if (!deleted) {
      throw new RpcNotFoundException('Programming category not found');
    }
    this.logger.log(`Programming category deleted: ${id}`);
    return new DeleteResponseDTO({
      message: 'Programming category deleted successfully',
      id,
    });
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
