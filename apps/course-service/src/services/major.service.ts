import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { majors } from '@app/database/schemas/course/major.schema';
import { faculties } from '@app/database/schemas/course/faculty.schema';
import {
  CreateMajorRequestDTO,
  DeleteResponseDTO,
  DRIZZLE,
  IMajorService,
  MajorResponseDTO,
  UpdateMajorRequestDTO,
} from '@app/contracts';
import {
  RpcBadRequestException,
  RpcConflictException,
  RpcNotFoundException,
} from '@app/common';

@Injectable()
export class MajorService implements IMajorService {
  private readonly logger = new Logger(MajorService.name);

  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

  async create(dto: CreateMajorRequestDTO): Promise<MajorResponseDTO> {
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
    return new MajorResponseDTO(created);
  }

  async findAll(facultyId?: string): Promise<MajorResponseDTO[]> {
    const query = this.db.select().from(majors);
    const rows = facultyId
      ? await query.where(eq(majors.facultyId, facultyId)).orderBy(majors.name)
      : await query.orderBy(majors.name);
    return rows.map((row) => new MajorResponseDTO(row));
  }

  async findOne(id: string): Promise<MajorResponseDTO> {
    const [found] = await this.db
      .select()
      .from(majors)
      .where(eq(majors.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Major not found');
    return new MajorResponseDTO(found);
  }

  async findBySlug(slug: string): Promise<MajorResponseDTO> {
    const [found] = await this.db
      .select()
      .from(majors)
      .where(eq(majors.slug, slug))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Major not found');
    return new MajorResponseDTO(found);
  }

  async update(
    id: string,
    dto: UpdateMajorRequestDTO,
  ): Promise<MajorResponseDTO> {
    await this.findOne(id);
    if (dto.slug) await this.ensureSlugAvailable(dto.slug, id);
    if (dto.facultyId) await this.ensureFacultyExists(dto.facultyId);
    const [updated] = await this.db
      .update(majors)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(majors.id, id))
      .returning();
    this.logger.log(`Major updated: ${id}`);
    return new MajorResponseDTO(updated);
  }

  async remove(id: string): Promise<DeleteResponseDTO> {
    const [deleted] = await this.db
      .delete(majors)
      .where(eq(majors.id, id))
      .returning();
    if (!deleted) throw new RpcNotFoundException('Major not found');
    this.logger.log(`Major deleted: ${id}`);
    return new DeleteResponseDTO({ message: 'Major deleted successfully', id });
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
