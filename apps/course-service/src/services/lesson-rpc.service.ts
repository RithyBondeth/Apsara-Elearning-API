import { Inject, Injectable, Logger } from '@nestjs/common';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { and, eq } from 'drizzle-orm';
import { lessons } from '@app/database/schemas/course/lessons/lesson.schema';
import { modules } from '@app/database/schemas/course/module.schema';
import {
  CreateLessonRequestDTO,
  DRIZZLE,
  UpdateLessonRequestDTO,
} from '@app/contracts';
import {
  RpcBadRequestException,
  RpcConflictException,
  RpcNotFoundException,
} from '@app/common';

@Injectable()
export class LessonRpcService {
  private readonly logger = new Logger(LessonRpcService.name);

  constructor(@Inject(DRIZZLE) private readonly db: NeonHttpDatabase<any>) {}

  async create(moduleId: string, dto: CreateLessonRequestDTO) {
    await this.ensureModuleExists(moduleId);
    await this.ensureSlugAvailable(moduleId, dto.slug);
    const [created] = await this.db
      .insert(lessons)
      .values({
        moduleId,
        title: dto.title,
        slug: dto.slug,
        type: dto.type,
        content: dto.content,
        videoUrl: dto.videoUrl,
        order: dto.order,
        estimatedMinutes: dto.estimatedMinutes,
      })
      .returning();
    this.logger.log(`Lesson created: ${created.id} (module ${moduleId})`);
    return created;
  }

  findAllByModule(moduleId: string) {
    return this.db
      .select()
      .from(lessons)
      .where(eq(lessons.moduleId, moduleId))
      .orderBy(lessons.order);
  }

  async findOne(id: string) {
    const [found] = await this.db
      .select()
      .from(lessons)
      .where(eq(lessons.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Lesson not found');
    return found;
  }

  async findBySlug(slug: string) {
    const [found] = await this.db
      .select()
      .from(lessons)
      .where(eq(lessons.slug, slug))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Lesson not found');
    return found;
  }

  async update(id: string, dto: UpdateLessonRequestDTO) {
    const existing = await this.findOne(id);
    if (dto.slug && dto.slug !== existing.slug) {
      await this.ensureSlugAvailable(existing.moduleId, dto.slug, id);
    }
    const [updated] = await this.db
      .update(lessons)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(lessons.id, id))
      .returning();
    this.logger.log(`Lesson updated: ${id}`);
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.db
      .delete(lessons)
      .where(eq(lessons.id, id))
      .returning();
    if (!deleted) throw new RpcNotFoundException('Lesson not found');
    this.logger.log(`Lesson deleted: ${id}`);
    return { message: 'Lesson deleted successfully', id };
  }

  private async ensureModuleExists(moduleId: string) {
    const [module] = await this.db
      .select()
      .from(modules)
      .where(eq(modules.id, moduleId))
      .limit(1);
    if (!module) throw new RpcBadRequestException('Module does not exist');
  }

  private async ensureSlugAvailable(
    moduleId: string,
    slug: string,
    exceptId?: string,
  ) {
    const [existing] = await this.db
      .select()
      .from(lessons)
      .where(and(eq(lessons.moduleId, moduleId), eq(lessons.slug, slug)))
      .limit(1);
    if (existing && existing.id !== exceptId) {
      throw new RpcConflictException(
        'Lesson with this slug already exists in the module',
      );
    }
  }
}
