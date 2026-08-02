import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { asc, eq } from 'drizzle-orm';
import { gradeLevels } from '@app/database/schemas/course/grade-level.schema';
import {
  CreateGradeLevelRequestDTO,
  DeleteResponseDTO,
  DRIZZLE,
  GradeLevelResponseDTO,
  IGradeLevelService,
  UpdateGradeLevelRequestDTO,
} from '@app/contracts';
import { RpcConflictException, RpcNotFoundException } from '@app/common';

@Injectable()
export class GradeLevelService implements IGradeLevelService {
  private readonly logger = new Logger(GradeLevelService.name);

  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

  async create(
    dto: CreateGradeLevelRequestDTO,
  ): Promise<GradeLevelResponseDTO> {
    await this.ensureGradeAvailable(dto.grade);
    const [created] = await this.db
      .insert(gradeLevels)
      .values({
        stage: dto.stage,
        grade: dto.grade,
        name: dto.name,
        nameKm: dto.nameKm,
        order: dto.order ?? dto.grade,
      })
      .returning();
    this.logger.log(`Grade level created: ${created.name}`);
    return new GradeLevelResponseDTO(created);
  }

  async findAll(): Promise<GradeLevelResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(gradeLevels)
      .orderBy(asc(gradeLevels.order));
    return rows.map((row) => new GradeLevelResponseDTO(row));
  }

  async findOne(id: string): Promise<GradeLevelResponseDTO> {
    const [found] = await this.db
      .select()
      .from(gradeLevels)
      .where(eq(gradeLevels.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Grade level not found');
    return new GradeLevelResponseDTO(found);
  }

  async update(
    id: string,
    dto: UpdateGradeLevelRequestDTO,
  ): Promise<GradeLevelResponseDTO> {
    await this.findOne(id);
    if (dto.grade !== undefined) await this.ensureGradeAvailable(dto.grade, id);
    const [updated] = await this.db
      .update(gradeLevels)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(gradeLevels.id, id))
      .returning();
    this.logger.log(`Grade level updated: ${id}`);
    return new GradeLevelResponseDTO(updated);
  }

  async remove(id: string): Promise<DeleteResponseDTO> {
    const [deleted] = await this.db
      .delete(gradeLevels)
      .where(eq(gradeLevels.id, id))
      .returning();
    if (!deleted) throw new RpcNotFoundException('Grade level not found');
    this.logger.log(`Grade level deleted: ${id}`);
    return new DeleteResponseDTO({
      message: 'Grade level deleted successfully',
      id,
    });
  }

  private async ensureGradeAvailable(grade: number, exceptId?: string) {
    const [existing] = await this.db
      .select()
      .from(gradeLevels)
      .where(eq(gradeLevels.grade, grade))
      .limit(1);
    if (existing && existing.id !== exceptId) {
      throw new RpcConflictException(`Grade ${grade} already exists`);
    }
  }
}
