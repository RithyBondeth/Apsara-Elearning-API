import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, eq } from 'drizzle-orm';
import { modules } from '@app/database/schemas/course/module.schema';
import { courses } from '@app/database/schemas/course/course.schema';
import {
  CreateModuleRequestDTO,
  DeleteResponseDTO,
  DRIZZLE,
  IModuleService,
  ModuleResponseDTO,
  UpdateModuleRequestDTO,
} from '@app/contracts';
import {
  CourseEntitlementService,
  RpcBadRequestException,
  RpcNotFoundException,
} from '@app/common';

@Injectable()
export class ModuleService implements IModuleService {
  private readonly logger = new Logger(ModuleService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    private readonly entitlements: CourseEntitlementService,
  ) {}

  async create(
    courseId: string,
    dto: CreateModuleRequestDTO,
  ): Promise<ModuleResponseDTO> {
    await this.ensureCourseExists(courseId);
    const [created] = await this.db
      .insert(modules)
      .values({
        courseId,
        title: dto.title,
        description: dto.description,
        order: dto.order,
      })
      .returning();
    this.logger.log(`Module created: ${created.id} (course ${courseId})`);
    return new ModuleResponseDTO(created);
  }

  async findAllByCourse(courseId: string): Promise<ModuleResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(modules)
      .where(eq(modules.courseId, courseId))
      .orderBy(modules.order);
    return rows.map((row) => new ModuleResponseDTO(row));
  }

  async findOne(id: string): Promise<ModuleResponseDTO> {
    const [found] = await this.db
      .select()
      .from(modules)
      .where(eq(modules.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Module not found');
    return new ModuleResponseDTO(found);
  }

  async findPublicByCourse(courseId: string): Promise<ModuleResponseDTO[]> {
    await this.entitlements.assertPublishedCourse(courseId);
    return this.findAllByCourse(courseId);
  }

  async findPublicOne(id: string): Promise<ModuleResponseDTO> {
    await this.entitlements.assertPublishedModule(id);
    return this.findOne(id);
  }

  async update(
    id: string,
    dto: UpdateModuleRequestDTO,
  ): Promise<ModuleResponseDTO> {
    await this.findOne(id);
    const [updated] = await this.db
      .update(modules)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(modules.id, id))
      .returning();
    this.logger.log(`Module updated: ${id}`);
    return new ModuleResponseDTO(updated);
  }

  async remove(id: string): Promise<DeleteResponseDTO> {
    const [deleted] = await this.db
      .delete(modules)
      .where(eq(modules.id, id))
      .returning();
    if (!deleted) throw new RpcNotFoundException('Module not found');
    this.logger.log(`Module deleted: ${id}`);
    return new DeleteResponseDTO({
      message: 'Module deleted successfully',
      id,
    });
  }

  /** Sets each module's `order` to its index in `orderedIds` (scoped to course). */
  async reorder(
    courseId: string,
    orderedIds: string[],
  ): Promise<ModuleResponseDTO[]> {
    await this.ensureCourseExists(courseId);
    // Sequential updates.
    for (let i = 0; i < orderedIds.length; i++) {
      await this.db
        .update(modules)
        .set({ order: i, updatedAt: new Date() })
        .where(
          and(eq(modules.id, orderedIds[i]), eq(modules.courseId, courseId)),
        );
    }
    this.logger.log(`Reordered ${orderedIds.length} modules in ${courseId}`);
    return this.findAllByCourse(courseId);
  }

  private async ensureCourseExists(courseId: string) {
    const [course] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);
    if (!course) throw new RpcBadRequestException('Course does not exist');
  }
}
