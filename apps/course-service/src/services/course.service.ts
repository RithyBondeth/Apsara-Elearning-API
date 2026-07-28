import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, eq, ilike, or, type SQL } from 'drizzle-orm';
import { courses } from '@app/database/schemas/course/course.schema';
import { subjects } from '@app/database/schemas/course/subject.schema';
import { gradeLevels } from '@app/database/schemas/course/grade-level.schema';
import { majors } from '@app/database/schemas/course/major.schema';
import { programmingCategories } from '@app/database/schemas/course/programming-category.schema';
import {
  CourseResponseDTO,
  CreateCourseRequestDTO,
  DeleteResponseDTO,
  DRIZZLE,
  ICourseService,
  SearchCoursesRequestDTO,
  UpdateCourseRequestDTO,
} from '@app/contracts';
import {
  RpcBadRequestException,
  RpcConflictException,
  RpcNotFoundException,
} from '@app/common';

@Injectable()
export class CourseService implements ICourseService {
  private readonly logger = new Logger(CourseService.name);

  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

  async create(dto: CreateCourseRequestDTO): Promise<CourseResponseDTO> {
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
        requiresSubscription: dto.requiresSubscription,
      })
      .returning();
    this.logger.log(`Course created: ${created.slug}`);
    return new CourseResponseDTO(created);
  }

  async findAll(): Promise<CourseResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(courses)
      .orderBy(courses.createdAt);
    return rows.map((row) => new CourseResponseDTO(row));
  }

  async findPublished(): Promise<CourseResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(courses)
      .where(eq(courses.published, true))
      .orderBy(courses.createdAt);
    return rows.map((row) => new CourseResponseDTO(row));
  }

  async findPublishedOne(id: string): Promise<CourseResponseDTO> {
    const [found] = await this.db
      .select()
      .from(courses)
      .where(and(eq(courses.id, id), eq(courses.published, true)))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Course not found');
    return new CourseResponseDTO(found);
  }

  async findPublishedBySlug(slug: string): Promise<CourseResponseDTO> {
    const [found] = await this.db
      .select()
      .from(courses)
      .where(and(eq(courses.slug, slug), eq(courses.published, true)))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Course not found');
    return new CourseResponseDTO(found);
  }

  /**
   * Keyword search over PUBLISHED courses only, with optional taxonomy filters
   * and pagination. Matches the keyword against title / titleKm / description /
   * descriptionKm (case-insensitive).
   */
  async search(dto: SearchCoursesRequestDTO): Promise<CourseResponseDTO[]> {
    const limit = dto.limit ?? 20;
    const offset = dto.offset ?? 0;

    const conditions: SQL[] = [eq(courses.published, true)];

    if (dto.q?.trim()) {
      const pattern = `%${dto.q.trim()}%`;
      const keyword = or(
        ilike(courses.title, pattern),
        ilike(courses.titleKm, pattern),
        ilike(courses.description, pattern),
        ilike(courses.descriptionKm, pattern),
      );
      if (keyword) conditions.push(keyword);
    }
    if (dto.programType) {
      conditions.push(eq(courses.programType, dto.programType));
    }
    if (dto.subjectId) conditions.push(eq(courses.subjectId, dto.subjectId));
    if (dto.gradeLevelId) {
      conditions.push(eq(courses.gradeLevelId, dto.gradeLevelId));
    }
    if (dto.majorId) conditions.push(eq(courses.majorId, dto.majorId));
    if (dto.categoryId) conditions.push(eq(courses.categoryId, dto.categoryId));

    const rows = await this.db
      .select()
      .from(courses)
      .where(and(...conditions))
      .orderBy(courses.createdAt)
      .limit(limit)
      .offset(offset);
    return rows.map((row) => new CourseResponseDTO(row));
  }

  async findOne(id: string): Promise<CourseResponseDTO> {
    const [found] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, id))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Course not found');
    return new CourseResponseDTO(found);
  }

  async findBySlug(slug: string): Promise<CourseResponseDTO> {
    const [found] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.slug, slug))
      .limit(1);
    if (!found) throw new RpcNotFoundException('Course not found');
    return new CourseResponseDTO(found);
  }

  async findBySubject(subjectId: string): Promise<CourseResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(courses)
      .where(and(eq(courses.subjectId, subjectId), eq(courses.published, true)))
      .orderBy(courses.createdAt);
    return rows.map((row) => new CourseResponseDTO(row));
  }

  async findByGrade(gradeLevelId: string): Promise<CourseResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(courses)
      .where(
        and(
          eq(courses.gradeLevelId, gradeLevelId),
          eq(courses.published, true),
        ),
      )
      .orderBy(courses.createdAt);
    return rows.map((row) => new CourseResponseDTO(row));
  }

  async findByMajor(majorId: string): Promise<CourseResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(courses)
      .where(and(eq(courses.majorId, majorId), eq(courses.published, true)))
      .orderBy(courses.createdAt);
    return rows.map((row) => new CourseResponseDTO(row));
  }

  async findByCategory(categoryId: string): Promise<CourseResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(courses)
      .where(
        and(eq(courses.categoryId, categoryId), eq(courses.published, true)),
      )
      .orderBy(courses.createdAt);
    return rows.map((row) => new CourseResponseDTO(row));
  }

  async update(
    id: string,
    dto: UpdateCourseRequestDTO,
  ): Promise<CourseResponseDTO> {
    await this.findOne(id);
    if (dto.slug) await this.ensureSlugAvailable(dto.slug, id);
    await this.ensurePlacementExists(dto);
    const [updated] = await this.db
      .update(courses)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    this.logger.log(`Course updated: ${id}`);
    return new CourseResponseDTO(updated);
  }

  async remove(id: string): Promise<DeleteResponseDTO> {
    const [deleted] = await this.db
      .delete(courses)
      .where(eq(courses.id, id))
      .returning();
    if (!deleted) throw new RpcNotFoundException('Course not found');
    this.logger.log(`Course deleted: ${id}`);
    return new DeleteResponseDTO({
      message: 'Course deleted successfully',
      id,
    });
  }

  setPublished(id: string, published: boolean): Promise<CourseResponseDTO> {
    return this.setPublishState(id, published);
  }

  private async setPublishState(
    id: string,
    published: boolean,
  ): Promise<CourseResponseDTO> {
    const [updated] = await this.db
      .update(courses)
      .set({ published, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    if (!updated) throw new RpcNotFoundException('Course not found');
    this.logger.log(`Course ${published ? 'published' : 'unpublished'}: ${id}`);
    return new CourseResponseDTO(updated);
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
