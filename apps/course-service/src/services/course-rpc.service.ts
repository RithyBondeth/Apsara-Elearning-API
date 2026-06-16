import { Inject, Injectable, Logger } from '@nestjs/common';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { courses } from '@app/database/schemas/course/course.schema';
import { categories } from '@app/database/schemas/course/category.schema';
import {
  CreateCourseRequestDTO,
  DRIZZLE,
  UpdateCourseRequestDTO,
} from '@app/contracts';
import {
  RpcBadRequestException,
  RpcConflictException,
  RpcNotFoundException,
} from '@app/common';

@Injectable()
export class CourseRpcService {
  private readonly logger = new Logger(CourseRpcService.name);

  constructor(@Inject(DRIZZLE) private readonly db: NeonHttpDatabase<any>) {}

  async create(dto: CreateCourseRequestDTO) {
    await this.ensureSlugAvailable(dto.slug);
    if (dto.categoryId) await this.ensureCategoryExists(dto.categoryId);
    const [created] = await this.db
      .insert(courses)
      .values({
        title: dto.title,
        slug: dto.slug,
        categoryId: dto.categoryId,
        description: dto.description,
        thumbnail: dto.thumbnail,
        difficulty: dto.difficulty,
        estimatedHours: dto.estimatedHours,
        published: dto.published,
      })
      .returning();
    this.logger.log(`Course created: ${created.slug}`);
    return created;
  }

  findAll() {
    return this.db.select().from(courses).orderBy(courses.createdAt);
  }

  findPublished() {
    return this.db
      .select()
      .from(courses)
      .where(eq(courses.published, true))
      .orderBy(courses.createdAt);
  }

  async findOne(id: string) {
    const [found] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Course not found');
    return found;
  }

  async findBySlug(slug: string) {
    const [found] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.slug, slug))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Course not found');
    return found;
  }

  findByCategory(categoryId: string) {
    return this.db
      .select()
      .from(courses)
      .where(eq(courses.categoryId, categoryId))
      .orderBy(courses.createdAt);
  }

  async update(id: string, dto: UpdateCourseRequestDTO) {
    await this.findOne(id);
    if (dto.slug) await this.ensureSlugAvailable(dto.slug, id);
    if (dto.categoryId) await this.ensureCategoryExists(dto.categoryId);
    const [updated] = await this.db
      .update(courses)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    this.logger.log(`Course updated: ${id}`);
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.db
      .delete(courses)
      .where(eq(courses.id, id))
      .returning();
    if (!deleted) throw new RpcNotFoundException('Course not found');
    this.logger.log(`Course deleted: ${id}`);
    return { message: 'Course deleted successfully', id };
  }

  setPublished(id: string, published: boolean) {
    return this.setPublishState(id, published);
  }

  private async setPublishState(id: string, published: boolean) {
    const [updated] = await this.db
      .update(courses)
      .set({ published, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    if (!updated) throw new RpcNotFoundException('Course not found');
    this.logger.log(`Course ${published ? 'published' : 'unpublished'}: ${id}`);
    return updated;
  }

  private async ensureSlugAvailable(slug: string, exceptId?: string) {
    const [existing] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.slug, slug))
      .limit(1);
    if (existing && existing.id !== exceptId) {
      throw new RpcConflictException('Course with this slug already exists');
    }
  }

  private async ensureCategoryExists(categoryId: string) {
    const [category] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);
    if (!category) {
      throw new RpcBadRequestException('Category does not exist');
    }
  }
}
