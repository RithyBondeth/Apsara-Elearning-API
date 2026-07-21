import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { COURSE_SERVICE, I_LESSON_PROGRESS_SERVICE } from '@app/contracts';
import type { ILessonProgressService, ILessonProgressRpcController } from '@app/contracts';

@Controller()
export class LessonProgressController implements ILessonProgressRpcController {
  constructor(
    @Inject(I_LESSON_PROGRESS_SERVICE) private readonly lessonProgressService: ILessonProgressService,
  ) {}

  @MessagePattern(COURSE_SERVICE.ACTIONS.PROGRESS_MARK_COMPLETE)
  markComplete(@Payload() payload: { userId: string; lessonId: string }) {
    return this.lessonProgressService.markComplete(
      payload.userId,
      payload.lessonId,
    );
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.PROGRESS_FIND_BY_USER)
  findByUser(@Payload() payload: { userId: string }) {
    return this.lessonProgressService.findByUser(payload.userId);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.PROGRESS_FIND_BY_LESSON)
  findByLesson(@Payload() payload: { userId: string; lessonId: string }) {
    return this.lessonProgressService.findByLesson(
      payload.userId,
      payload.lessonId,
    );
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.PROGRESS_CALCULATE)
  calculate(@Payload() payload: { userId: string; courseId: string }) {
    return this.lessonProgressService.recalculate(
      payload.userId,
      payload.courseId,
    );
  }
}
