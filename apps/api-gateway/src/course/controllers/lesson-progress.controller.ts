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
import {
  COURSE_SERVICE,
  EnrollmentResponseDTO,
  ILessonProgressHttpController,
  LessonCompletionResponseDTO,
  LessonProgressResponseDTO,
} from '@app/contracts';
import { CurrentUser, JwtAuthGuard } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { rpcCall } from '@app/common';

@ApiTags('Lesson Progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lesson-progress')
export class LessonProgressController implements ILessonProgressHttpController {
  constructor(
    @Inject(COURSE_SERVICE.NAME)
    private readonly courseClient: ClientProxy,
  ) {}

  @Post('lesson/:lessonId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a lesson as complete' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lesson marked as complete',
    type: LessonCompletionResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  markComplete(
    @CurrentUser('id') userId: string,
    @Param('lessonId') lessonId: string,
  ): Promise<LessonCompletionResponseDTO> {
    return rpcCall<LessonCompletionResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.PROGRESS_MARK_COMPLETE,
      { userId, lessonId },
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get current user lesson progress' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Progress retrieved',
    type: [LessonProgressResponseDTO],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  myProgress(
    @CurrentUser('id') userId: string,
  ): Promise<LessonProgressResponseDTO[]> {
    return rpcCall<LessonProgressResponseDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.PROGRESS_FIND_BY_USER,
      { userId },
    );
  }

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Get progress for a specific lesson' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lesson progress retrieved',
    type: LessonProgressResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  progressForLesson(
    @CurrentUser('id') userId: string,
    @Param('lessonId') lessonId: string,
  ): Promise<LessonProgressResponseDTO> {
    return rpcCall<LessonProgressResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.PROGRESS_FIND_BY_LESSON,
      { userId, lessonId },
    );
  }

  @Post('course/:courseId/recalculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recalculate course progress' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Progress recalculated',
    type: EnrollmentResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  recalculate(
    @CurrentUser('id') userId: string,
    @Param('courseId') courseId: string,
  ): Promise<EnrollmentResponseDTO> {
    return rpcCall<EnrollmentResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.PROGRESS_CALCULATE,
      { userId, courseId },
    );
  }
}
