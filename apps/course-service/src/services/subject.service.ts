import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { subjects } from '@app/database/schemas/course/subject.schema';
import {
  CreateSubjectRequestDTO,
  DeleteResponseDTO,
  DRIZZLE,
  ISubjectService,
  SubjectResponseDTO,
  UpdateSubjectRequestDTO,
} from '@app/contracts';
import { RpcConflictException, RpcNotFoundException } from '@app/common';

@Injectable()
export class SubjectService implements ISubjectService {
  private readonly logger = new Logger(SubjectService.name);

  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

  async create(dto: CreateSubjectRequestDTO): Promise<SubjectResponseDTO> {
    await this.ensureSlugAvailable(dto.slug);
    const [created] = await this.db
      .insert(subjects)
      .values({
        name: dto.name,
        nameKm: dto.nameKm,
        slug: dto.slug,
        description: dto.description,
        descriptionKm: dto.descriptionKm,
        icon: dto.icon,
      })
      .returning();
    this.logger.log(`Subject created: ${created.slug}`);
    return new SubjectResponseDTO(created);
  }

  async findAll(): Promise<SubjectResponseDTO[]> {
    const rows = await this.db.select().from(subjects).orderBy(subjects.name);
    return rows.map((row) => new SubjectResponseDTO(row));
  }

  async findOne(id: string): Promise<SubjectResponseDTO> {
    const [found] = await this.db
      .select()
      .from(subjects)
      .where(eq(subjects.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Subject not found');
    return new SubjectResponseDTO(found);
  }

  async findBySlug(slug: string): Promise<SubjectResponseDTO> {
    const [found] = await this.db
      .select()
      .from(subjects)
      .where(eq(subjects.slug, slug))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Subject not found');
    return new SubjectResponseDTO(found);
  }

  async update(
    id: string,
    dto: UpdateSubjectRequestDTO,
  ): Promise<SubjectResponseDTO> {
    await this.findOne(id);
    if (dto.slug) await this.ensureSlugAvailable(dto.slug, id);
    const [updated] = await this.db
      .update(subjects)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(subjects.id, id))
      .returning();
    this.logger.log(`Subject updated: ${id}`);
    return new SubjectResponseDTO(updated);
  }

  async remove(id: string): Promise<DeleteResponseDTO> {
    const [deleted] = await this.db
      .delete(subjects)
      .where(eq(subjects.id, id))
      .returning();
    if (!deleted) throw new RpcNotFoundException('Subject not found');
    this.logger.log(`Subject deleted: ${id}`);
    return new DeleteResponseDTO({
      message: 'Subject deleted successfully',
      id,
    });
  }

  private async ensureSlugAvailable(slug: string, exceptId?: string) {
    const [existing] = await this.db
      .select()
      .from(subjects)
      .where(eq(subjects.slug, slug))
      .limit(1);
    if (existing && existing.id !== exceptId) {
      throw new RpcConflictException('Subject with this slug already exists');
    }
  }
}
