import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LessonProgressRpcService } from '../services/lesson-progress-rpc.service';
import { COURSE_SERVICE } from '@app/contracts';

@Controller()
export class LessonProgressRpcController {
  constructor(
    private readonly lessonProgressRpcService: LessonProgressRpcService,
  ) {}

  @MessagePattern(COURSE_SERVICE.ACTIONS.PROGRESS_MARK_COMPLETE)
  markComplete(@Payload() payload: { userId: string; lessonId: string }) {
    return this.lessonProgressRpcService.markComplete(
      payload.userId,
      payload.lessonId,
    );
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.PROGRESS_FIND_BY_USER)
  findByUser(@Payload() payload: { userId: string }) {
    return this.lessonProgressRpcService.findByUser(payload.userId);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.PROGRESS_FIND_BY_LESSON)
  findByLesson(@Payload() payload: { userId: string; lessonId: string }) {
    return this.lessonProgressRpcService.findByLesson(
      payload.userId,
      payload.lessonId,
    );
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.PROGRESS_CALCULATE)
  calculate(@Payload() payload: { userId: string; courseId: string }) {
    return this.lessonProgressRpcService.recalculate(
      payload.userId,
      payload.courseId,
    );
  }
}
