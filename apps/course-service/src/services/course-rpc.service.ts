import { Inject, Injectable, Logger } from '@nestjs/common';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { courses } from '@app/database/schemas/course/course.schema';
import { subjects } from '@app/database/schemas/course/subject.schema';
import { gradeLevels } from '@app/database/schemas/course/grade-level.schema';
import { majors } from '@app/database/schemas/course/major.schema';
import { programmingCategories } from '@app/database/schemas/course/programming-category.schema';
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
    await this.ensurePlacementExists(dto);
    const [created] = await this.db
      .insert(courses)
      .values({
        programType: dto.programType,
        title: dto.title,
        titleKm: dto.titleKm,
        slug: dto.slug,
        subjectId: dto.subjectId,
        gradeLevelId: dto.gradeLevelId,
        majorId: dto.majorId,
        categoryId: dto.categoryId,
        description: dto.description,
        descriptionKm: dto.descriptionKm,
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

  findBySubject(subjectId: string) {
    return this.db
      .select()
      .from(courses)
      .where(eq(courses.subjectId, subjectId))
      .orderBy(courses.createdAt);
  }

  findByGrade(gradeLevelId: string) {
    return this.db
      .select()
      .from(courses)
      .where(eq(courses.gradeLevelId, gradeLevelId))
      .orderBy(courses.createdAt);
  }

  findByMajor(majorId: string) {
    return this.db
      .select()
      .from(courses)
      .where(eq(courses.majorId, majorId))
      .orderBy(courses.createdAt);
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
    await this.ensurePlacementExists(dto);
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

  /** Validates whichever placement FKs the payload carries. */
  private async ensurePlacementExists(
    dto: CreateCourseRequestDTO | UpdateCourseRequestDTO,
  ) {
    if (dto.subjectId) {
      const [subject] = await this.db
        .select({ id: subjects.id })
        .from(subjects)
        .where(eq(subjects.id, dto.subjectId))
        .limit(1);
      if (!subject) throw new RpcBadRequestException('Subject does not exist');
    }
    if (dto.gradeLevelId) {
      const [gradeLevel] = await this.db
        .select({ id: gradeLevels.id })
        .from(gradeLevels)
        .where(eq(gradeLevels.id, dto.gradeLevelId))
        .limit(1);
      if (!gradeLevel) {
        throw new RpcBadRequestException('Grade level does not exist');
      }
    }
    if (dto.majorId) {
      const [major] = await this.db
        .select({ id: majors.id })
        .from(majors)
        .where(eq(majors.id, dto.majorId))
        .limit(1);
      if (!major) throw new RpcBadRequestException('Major does not exist');
    }
    if (dto.categoryId) {
      const [category] = await this.db
        .select({ id: programmingCategories.id })
        .from(programmingCategories)
        .where(eq(programmingCategories.id, dto.categoryId))
        .limit(1);
      if (!category) {
        throw new RpcBadRequestException('Programming category does not exist');
      }
    }
  }
}
