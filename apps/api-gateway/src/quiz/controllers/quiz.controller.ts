import {
  Body,
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
  ASSESSMENT_SERVICE,
  AttemptAnswerResponseDTO,
  AttemptResponseDTO,
  IQuizHttpController,
  QuizResponseDTO,
  StartAttemptResponseDTO,
  SubmitAttemptRequestDTO,
  SubmitAttemptResponseDTO,
} from '@app/contracts';
import { CurrentUser, JwtAuthGuard } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { rpcCall } from '@app/common';

@ApiTags('Quiz')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quiz')
export class QuizController implements IQuizHttpController {
  constructor(
    @Inject(ASSESSMENT_SERVICE.NAME) private readonly client: ClientProxy,
  ) {}

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Get all quizzes for a specific lesson' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quizzes retrieved successfully',
    type: [QuizResponseDTO],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  findByLesson(
    @CurrentUser('id') userId: string,
    @Param('lessonId') lessonId: string,
  ): Promise<QuizResponseDTO[]> {
    return rpcCall<QuizResponseDTO[]>(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.QUIZ_FIND_PUBLIC_ALL,
      { lessonId, userId },
    );
  }

  @Get('attempts')
  @ApiOperation({ summary: 'Get current user quiz attempts' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attempts retrieved successfully',
    type: [AttemptResponseDTO],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  myAttempts(@CurrentUser('id') userId: string): Promise<AttemptResponseDTO[]> {
    return rpcCall<AttemptResponseDTO[]>(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.ATTEMPT_FIND_ALL,
      { userId },
    );
  }

  @Get('attempt/:id')
  @ApiOperation({ summary: 'Get a specific quiz attempt by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attempt retrieved successfully',
    type: AttemptResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Attempt not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  attempt(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<AttemptResponseDTO> {
    return rpcCall<AttemptResponseDTO>(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.ATTEMPT_FIND_ONE,
      { id, userId },
    );
  }

  @Get('attempt/:id/answers')
  @ApiOperation({ summary: 'Get answers for a specific quiz attempt' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Answers retrieved successfully',
    type: [AttemptAnswerResponseDTO],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  attemptAnswers(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<AttemptAnswerResponseDTO[]> {
    return rpcCall<AttemptAnswerResponseDTO[]>(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.ATTEMPT_ANSWER_FIND_ALL,
      { attemptId: id, userId },
    );
  }

  @Post('attempt/:attemptId/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit answers for a quiz attempt' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz attempt submitted and graded',
    type: SubmitAttemptResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  submit(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
    @Body() body: SubmitAttemptRequestDTO,
  ): Promise<SubmitAttemptResponseDTO> {
    return rpcCall<SubmitAttemptResponseDTO>(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.ATTEMPT_SUBMIT,
      { userId, attemptId, answers: body.answers },
    );
  }

  @Post(':quizId/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start a new quiz attempt' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz attempt started successfully',
    type: StartAttemptResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  start(
    @CurrentUser('id') userId: string,
    @Param('quizId') quizId: string,
  ): Promise<StartAttemptResponseDTO> {
    return rpcCall<StartAttemptResponseDTO>(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.ATTEMPT_START,
      { userId, quizId },
    );
  }
}
