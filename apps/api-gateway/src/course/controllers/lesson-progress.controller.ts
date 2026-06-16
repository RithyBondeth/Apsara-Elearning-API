import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { COURSE_SERVICE } from '@app/contracts';
import { CurrentUser, JwtAuthGuard } from '@app/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { rpcCall } from '../../utils/rpc-call';

@ApiTags('Lesson Progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lesson-progress')
export class LessonProgressController {
  constructor(
    @Inject(COURSE_SERVICE.NAME)
    private readonly courseClient: ClientProxy,
  ) {}

  @Post('lesson/:lessonId')
  @HttpCode(HttpStatus.OK)
  markComplete(
    @CurrentUser('id') userId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.PROGRESS_MARK_COMPLETE,
      { userId, lessonId },
    );
  }

  @Get()
  myProgress(@CurrentUser('id') userId: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.PROGRESS_FIND_BY_USER,
      { userId },
    );
  }

  @Get('lesson/:lessonId')
  progressForLesson(
    @CurrentUser('id') userId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.PROGRESS_FIND_BY_LESSON,
      { userId, lessonId },
    );
  }

  @Post('course/:courseId/recalculate')
  @HttpCode(HttpStatus.OK)
  recalculate(
    @CurrentUser('id') userId: string,
    @Param('courseId') courseId: string,
  ) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.PROGRESS_CALCULATE, {
      userId,
      courseId,
    });
  }
}
