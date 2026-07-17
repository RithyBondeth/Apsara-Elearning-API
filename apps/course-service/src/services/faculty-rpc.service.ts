import { Inject, Injectable, Logger } from '@nestjs/common';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { faculties } from '@app/database/schemas/course/faculty.schema';
import {
  CreateFacultyRequestDTO,
  DRIZZLE,
  UpdateFacultyRequestDTO,
} from '@app/contracts';
import { RpcConflictException, RpcNotFoundException } from '@app/common';

@Injectable()
export class FacultyRpcService {
  private readonly logger = new Logger(FacultyRpcService.name);

  constructor(@Inject(DRIZZLE) private readonly db: NeonHttpDatabase<any>) {}

  async create(dto: CreateFacultyRequestDTO) {
    await this.ensureSlugAvailable(dto.slug);
    const [created] = await this.db
      .insert(faculties)
      .values({
        name: dto.name,
        nameKm: dto.nameKm,
        slug: dto.slug,
        description: dto.description,
        icon: dto.icon,
      })
      .returning();
    this.logger.log(`Faculty created: ${created.slug}`);
    return created;
  }

  findAll() {
    return this.db.select().from(faculties).orderBy(faculties.name);
  }

  async findOne(id: string) {
    const [found] = await this.db
      .select()
      .from(faculties)
      .where(eq(faculties.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Faculty not found');
    return found;
  }

  async findBySlug(slug: string) {
    const [found] = await this.db
      .select()
      .from(faculties)
      .where(eq(faculties.slug, slug))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Faculty not found');
    return found;
  }

  async update(id: string, dto: UpdateFacultyRequestDTO) {
    await this.findOne(id);
    if (dto.slug) await this.ensureSlugAvailable(dto.slug, id);
    const [updated] = await this.db
      .update(faculties)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(faculties.id, id))
      .returning();
    this.logger.log(`Faculty updated: ${id}`);
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.db
      .delete(faculties)
      .where(eq(faculties.id, id))
      .returning();
    if (!deleted) throw new RpcNotFoundException('Faculty not found');
    this.logger.log(`Faculty deleted: ${id}`);
    return { message: 'Faculty deleted successfully', id };
  }

  private async ensureSlugAvailable(slug: string, exceptId?: string) {
    const [existing] = await this.db
      .select()
      .from(faculties)
      .where(eq(faculties.slug, slug))
      .limit(1);
    if (existing && existing.id !== exceptId) {
      throw new RpcConflictException('Faculty with this slug already exists');
    }
  }
}
