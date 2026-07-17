import { Inject, Injectable, Logger } from '@nestjs/common';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { majors } from '@app/database/schemas/course/major.schema';
import { faculties } from '@app/database/schemas/course/faculty.schema';
import {
  CreateMajorRequestDTO,
  DRIZZLE,
  UpdateMajorRequestDTO,
} from '@app/contracts';
import {
  RpcBadRequestException,
  RpcConflictException,
  RpcNotFoundException,
} from '@app/common';

@Injectable()
export class MajorRpcService {
  private readonly logger = new Logger(MajorRpcService.name);

  constructor(@Inject(DRIZZLE) private readonly db: NeonHttpDatabase<any>) {}

  async create(dto: CreateMajorRequestDTO) {
    await this.ensureSlugAvailable(dto.slug);
    if (dto.facultyId) await this.ensureFacultyExists(dto.facultyId);
    const [created] = await this.db
      .insert(majors)
      .values({
        facultyId: dto.facultyId,
        name: dto.name,
        nameKm: dto.nameKm,
        slug: dto.slug,
        description: dto.description,
      })
      .returning();
    this.logger.log(`Major created: ${created.slug}`);
    return created;
  }

  findAll(facultyId?: string) {
    const query = this.db.select().from(majors);
    if (facultyId)
      return query.where(eq(majors.facultyId, facultyId)).orderBy(majors.name);
    return query.orderBy(majors.name);
  }

  async findOne(id: string) {
    const [found] = await this.db
      .select()
      .from(majors)
      .where(eq(majors.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Major not found');
    return found;
  }

  async findBySlug(slug: string) {
    const [found] = await this.db
      .select()
      .from(majors)
      .where(eq(majors.slug, slug))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Major not found');
    return found;
  }

  async update(id: string, dto: UpdateMajorRequestDTO) {
    await this.findOne(id);
    if (dto.slug) await this.ensureSlugAvailable(dto.slug, id);
    if (dto.facultyId) await this.ensureFacultyExists(dto.facultyId);
    const [updated] = await this.db
      .update(majors)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(majors.id, id))
      .returning();
    this.logger.log(`Major updated: ${id}`);
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.db
      .delete(majors)
      .where(eq(majors.id, id))
      .returning();
    if (!deleted) throw new RpcNotFoundException('Major not found');
    this.logger.log(`Major deleted: ${id}`);
    return { message: 'Major deleted successfully', id };
  }

  private async ensureSlugAvailable(slug: string, exceptId?: string) {
    const [existing] = await this.db
      .select()
      .from(majors)
      .where(eq(majors.slug, slug))
      .limit(1);
    if (existing && existing.id !== exceptId) {
      throw new RpcConflictException('Major with this slug already exists');
    }
  }

  private async ensureFacultyExists(facultyId: string) {
    const [faculty] = await this.db
      .select()
      .from(faculties)
      .where(eq(faculties.id, facultyId))
      .limit(1);
    if (!faculty) throw new RpcBadRequestException('Faculty does not exist');
  }
}
