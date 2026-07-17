import { Inject, Injectable, Logger } from '@nestjs/common';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { asc, eq } from 'drizzle-orm';
import { gradeLevels } from '@app/database/schemas/course/grade-level.schema';
import {
  CreateGradeLevelRequestDTO,
  DRIZZLE,
  UpdateGradeLevelRequestDTO,
} from '@app/contracts';
import { RpcConflictException, RpcNotFoundException } from '@app/common';

@Injectable()
export class GradeLevelRpcService {
  private readonly logger = new Logger(GradeLevelRpcService.name);

  constructor(@Inject(DRIZZLE) private readonly db: NeonHttpDatabase<any>) {}

  async create(dto: CreateGradeLevelRequestDTO) {
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
    return created;
  }

  findAll() {
    return this.db.select().from(gradeLevels).orderBy(asc(gradeLevels.order));
  }

  async findOne(id: string) {
    const [found] = await this.db
      .select()
      .from(gradeLevels)
      .where(eq(gradeLevels.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Grade level not found');
    return found;
  }

  async update(id: string, dto: UpdateGradeLevelRequestDTO) {
    await this.findOne(id);
    if (dto.grade !== undefined) await this.ensureGradeAvailable(dto.grade, id);
    const [updated] = await this.db
      .update(gradeLevels)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(gradeLevels.id, id))
      .returning();
    this.logger.log(`Grade level updated: ${id}`);
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.db
      .delete(gradeLevels)
      .where(eq(gradeLevels.id, id))
      .returning();
    if (!deleted) throw new RpcNotFoundException('Grade level not found');
    this.logger.log(`Grade level deleted: ${id}`);
    return { message: 'Grade level deleted successfully', id };
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
