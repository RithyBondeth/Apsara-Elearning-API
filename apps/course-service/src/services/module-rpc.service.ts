import { Inject, Injectable, Logger } from '@nestjs/common';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { and, eq } from 'drizzle-orm';
import { modules } from '@app/database/schemas/course/module.schema';
import { courses } from '@app/database/schemas/course/course.schema';
import {
  CreateModuleRequestDTO,
  DRIZZLE,
  UpdateModuleRequestDTO,
} from '@app/contracts';
import { RpcBadRequestException, RpcNotFoundException } from '@app/common';

@Injectable()
export class ModuleRpcService {
  private readonly logger = new Logger(ModuleRpcService.name);

  constructor(@Inject(DRIZZLE) private readonly db: NeonHttpDatabase<any>) {}

  async create(courseId: string, dto: CreateModuleRequestDTO) {
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
    return created;
  }

  findAllByCourse(courseId: string) {
    return this.db
      .select()
      .from(modules)
      .where(eq(modules.courseId, courseId))
      .orderBy(modules.order);
  }

  async findOne(id: string) {
    const [found] = await this.db
      .select()
      .from(modules)
      .where(eq(modules.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Module not found');
    return found;
  }

  async update(id: string, dto: UpdateModuleRequestDTO) {
    await this.findOne(id);
    const [updated] = await this.db
      .update(modules)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(modules.id, id))
      .returning();
    this.logger.log(`Module updated: ${id}`);
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.db
      .delete(modules)
      .where(eq(modules.id, id))
      .returning();
    if (!deleted) throw new RpcNotFoundException('Module not found');
    this.logger.log(`Module deleted: ${id}`);
    return { message: 'Module deleted successfully', id };
  }

  /** Sets each module's `order` to its index in `orderedIds` (scoped to course). */
  async reorder(courseId: string, orderedIds: string[]) {
    await this.ensureCourseExists(courseId);
    // Sequential updates — neon-http has no interactive transactions.
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
