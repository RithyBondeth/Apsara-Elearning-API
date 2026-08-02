import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, eq } from 'drizzle-orm';
import { lessons } from '@app/database/schemas/course/lessons/lesson.schema';
import { modules } from '@app/database/schemas/course/module.schema';
import {
  CreateLessonRequestDTO,
  DeleteResponseDTO,
  DRIZZLE,
  ILessonService,
  LessonResponseDTO,
  UpdateLessonRequestDTO,
} from '@app/contracts';
import {
  RpcBadRequestException,
  RpcConflictException,
  RpcNotFoundException,
  CourseEntitlementService,
} from '@app/common';

@Injectable()
export class LessonService implements ILessonService {
  private readonly logger = new Logger(LessonService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    private readonly entitlements: CourseEntitlementService,
  ) {}

  async create(
    moduleId: string,
    dto: CreateLessonRequestDTO,
  ): Promise<LessonResponseDTO> {
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
    return new LessonResponseDTO(created);
  }

  async findAllByModule(moduleId: string): Promise<LessonResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(lessons)
      .where(eq(lessons.moduleId, moduleId))
      .orderBy(lessons.order);
    return rows.map((row) => new LessonResponseDTO(row));
  }

  async findOne(id: string): Promise<LessonResponseDTO> {
    const [found] = await this.db
      .select()
      .from(lessons)
      .where(eq(lessons.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Lesson not found');
    return new LessonResponseDTO(found);
  }

  async findBySlug(slug: string): Promise<LessonResponseDTO> {
    const [found] = await this.db
      .select()
      .from(lessons)
      .where(eq(lessons.slug, slug))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Lesson not found');
    return new LessonResponseDTO(found);
  }

  async findPublicByModule(
    moduleId: string,
    userId?: string,
  ): Promise<LessonResponseDTO[]> {
    const canReadContent = await this.entitlements.canReadModuleContent(
      moduleId,
      userId,
    );
    const rows = await this.db
      .select()
      .from(lessons)
      .where(eq(lessons.moduleId, moduleId))
      .orderBy(lessons.order);

    return rows.map((row) => {
      if (canReadContent)
        return new LessonResponseDTO({ ...row, locked: false });
      return new LessonResponseDTO({
        ...row,
        content: undefined,
        videoUrl: undefined,
        locked: true,
      });
    });
  }

  async findPublicOne(id: string, userId?: string): Promise<LessonResponseDTO> {
    await this.entitlements.assertCanReadLesson({ id }, userId);
    const lesson = await this.findOne(id);
    return new LessonResponseDTO({ ...lesson, locked: false });
  }

  async findPublicBySlug(
    slug: string,
    userId?: string,
  ): Promise<LessonResponseDTO> {
    await this.entitlements.assertCanReadLesson({ slug }, userId);
    const lesson = await this.findBySlug(slug);
    return new LessonResponseDTO({ ...lesson, locked: false });
  }

  async update(
    id: string,
    dto: UpdateLessonRequestDTO,
  ): Promise<LessonResponseDTO> {
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
    return new LessonResponseDTO(updated);
  }

  async remove(id: string): Promise<DeleteResponseDTO> {
    const [deleted] = await this.db
      .delete(lessons)
      .where(eq(lessons.id, id))
      .returning();
    if (!deleted) throw new RpcNotFoundException('Lesson not found');
    this.logger.log(`Lesson deleted: ${id}`);
    return new DeleteResponseDTO({
      message: 'Lesson deleted successfully',
      id,
    });
  }

  /** Sets each lesson's `order` to its index in `orderedIds` (scoped to module). */
  async reorder(
    moduleId: string,
    orderedIds: string[],
  ): Promise<LessonResponseDTO[]> {
    await this.ensureModuleExists(moduleId);
    // Sequential updates.
    for (let i = 0; i < orderedIds.length; i++) {
      await this.db
        .update(lessons)
        .set({ order: i, updatedAt: new Date() })
        .where(
          and(eq(lessons.id, orderedIds[i]), eq(lessons.moduleId, moduleId)),
        );
    }
    this.logger.log(`Reordered ${orderedIds.length} lessons in ${moduleId}`);
    return this.findAllByModule(moduleId);
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
