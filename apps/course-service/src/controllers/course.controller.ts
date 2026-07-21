import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  COURSE_SERVICE,
  CreateCourseRequestDTO,
  UpdateCourseRequestDTO,
  I_COURSE_SERVICE,
} from '@app/contracts';
import type { ICourseService, ICourseRpcController } from '@app/contracts';
import { idOf, slugOf, splitUpdate } from '@app/utils';

@Controller()
export class CourseRpcController implements ICourseRpcController {
  constructor(
    @Inject(I_COURSE_SERVICE) private readonly courseService: ICourseService,
  ) {}

  @MessagePattern(COURSE_SERVICE.ACTIONS.COURSE_CREATE)
  create(@Payload() dto: CreateCourseRequestDTO) {
    return this.courseService.create(dto);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.COURSE_FIND_ALL)
  findAll() {
    return this.courseService.findAll();
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.COURSE_FIND_PUBLISHED)
  findPublished() {
    return this.courseService.findPublished();
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.COURSE_FIND_ONE)
  findOne(@Payload() payload: string | { id: string }) {
    return this.courseService.findOne(idOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.COURSE_FIND_BY_SLUG)
  findBySlug(@Payload() payload: string | { slug: string }) {
    return this.courseService.findBySlug(slugOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.COURSE_FIND_BY_SUBJECT)
  findBySubject(@Payload() payload: string | { subjectId: string }) {
    const subjectId = typeof payload === 'string' ? payload : payload.subjectId;
    return this.courseService.findBySubject(subjectId);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.COURSE_FIND_BY_GRADE)
  findByGrade(@Payload() payload: string | { gradeLevelId: string }) {
    const gradeLevelId =
      typeof payload === 'string' ? payload : payload.gradeLevelId;
    return this.courseService.findByGrade(gradeLevelId);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.COURSE_FIND_BY_MAJOR)
  findByMajor(@Payload() payload: string | { majorId: string }) {
    const majorId = typeof payload === 'string' ? payload : payload.majorId;
    return this.courseService.findByMajor(majorId);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.COURSE_FIND_BY_CATEGORY)
  findByCategory(@Payload() payload: string | { categoryId: string }) {
    const categoryId =
      typeof payload === 'string' ? payload : payload.categoryId;
    return this.courseService.findByCategory(categoryId);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.COURSE_UPDATE)
  update(@Payload() payload: UpdateCourseRequestDTO & { id: string }) {
    const { id, data } = splitUpdate(payload);
    return this.courseService.update(id, data);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.COURSE_DELETE)
  remove(@Payload() payload: string | { id: string }) {
    return this.courseService.remove(idOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.COURSE_PUBLISH)
  publish(@Payload() payload: string | { id: string }) {
    return this.courseService.setPublished(idOf(payload), true);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.COURSE_UNPUBLISH)
  unpublish(@Payload() payload: string | { id: string }) {
    return this.courseService.setPublished(idOf(payload), false);
  }
}
