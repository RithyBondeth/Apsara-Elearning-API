import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LessonRpcService } from '../services/lesson-rpc.service';
import {
  COURSE_SERVICE,
  CreateLessonRequestDTO,
  UpdateLessonRequestDTO,
} from '@app/contracts';
import { idOf, slugOf, splitUpdate } from '../utils/payload';

@Controller()
export class LessonRpcController {
  constructor(private readonly lessonRpcService: LessonRpcService) {}

  @MessagePattern(COURSE_SERVICE.ACTIONS.LESSON_CREATE)
  create(@Payload() payload: CreateLessonRequestDTO & { moduleId: string }) {
    const { moduleId, ...dto } = payload;
    return this.lessonRpcService.create(moduleId, dto);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.LESSON_FIND_ALL)
  findAll(@Payload() payload: string | { moduleId: string }) {
    const moduleId =
      typeof payload === 'string' ? payload : payload.moduleId;
    return this.lessonRpcService.findAllByModule(moduleId);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.LESSON_FIND_ONE)
  findOne(@Payload() payload: string | { id: string }) {
    return this.lessonRpcService.findOne(idOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.LESSON_FIND_BY_SLUG)
  findBySlug(@Payload() payload: string | { slug: string }) {
    return this.lessonRpcService.findBySlug(slugOf(payload));
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.LESSON_UPDATE)
  update(@Payload() payload: UpdateLessonRequestDTO & { id: string }) {
    const { id, data } = splitUpdate(payload);
    return this.lessonRpcService.update(id, data);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.LESSON_DELETE)
  remove(@Payload() payload: string | { id: string }) {
    return this.lessonRpcService.remove(idOf(payload));
  }
}
