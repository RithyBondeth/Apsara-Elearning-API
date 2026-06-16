import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CourseRpcService } from '../services/course-rpc.service';
import {
  COURSE_SERVICE,
  CreateCourseRequestDTO,
  UpdateCourseRequestDTO,
} from '@app/contracts';
import { idOf, slugOf, splitUpdate } from '../utils/payload';

@Controller()
export class CourseRpcController {
  constructor(private readonly courseService: CourseRpcService) {}

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
