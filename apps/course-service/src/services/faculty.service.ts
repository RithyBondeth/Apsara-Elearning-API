import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { faculties } from '@app/database/schemas/course/faculty.schema';
import {
  CreateFacultyRequestDTO,
  DeleteResponseDTO,
  DRIZZLE,
  FacultyResponseDTO,
  IFacultyService,
  UpdateFacultyRequestDTO,
} from '@app/contracts';
import { RpcConflictException, RpcNotFoundException } from '@app/common';

@Injectable()
export class FacultyService implements IFacultyService {
  private readonly logger = new Logger(FacultyService.name);

  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

  async create(dto: CreateFacultyRequestDTO): Promise<FacultyResponseDTO> {
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
    return new FacultyResponseDTO(created);
  }

  async findAll(): Promise<FacultyResponseDTO[]> {
    const rows = await this.db.select().from(faculties).orderBy(faculties.name);
    return rows.map((row) => new FacultyResponseDTO(row));
  }

  async findOne(id: string): Promise<FacultyResponseDTO> {
    const [found] = await this.db
      .select()
      .from(faculties)
      .where(eq(faculties.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Faculty not found');
    return new FacultyResponseDTO(found);
  }

  async findBySlug(slug: string): Promise<FacultyResponseDTO> {
    const [found] = await this.db
      .select()
      .from(faculties)
      .where(eq(faculties.slug, slug))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Faculty not found');
    return new FacultyResponseDTO(found);
  }

  async update(
    id: string,
    dto: UpdateFacultyRequestDTO,
  ): Promise<FacultyResponseDTO> {
    await this.findOne(id);
    if (dto.slug) await this.ensureSlugAvailable(dto.slug, id);
    const [updated] = await this.db
      .update(faculties)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(faculties.id, id))
      .returning();
    this.logger.log(`Faculty updated: ${id}`);
    return new FacultyResponseDTO(updated);
  }

  async remove(id: string): Promise<DeleteResponseDTO> {
    const [deleted] = await this.db
      .delete(faculties)
      .where(eq(faculties.id, id))
      .returning();
    if (!deleted) throw new RpcNotFoundException('Faculty not found');
    this.logger.log(`Faculty deleted: ${id}`);
    return new DeleteResponseDTO({
      message: 'Faculty deleted successfully',
      id,
    });
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
