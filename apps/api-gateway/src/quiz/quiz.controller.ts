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
  SubmitAttemptRequestDTO,
  QuizResponseDTO,
  AttemptResponseDTO,
  AttemptAnswerResponseDTO,
} from '@app/contracts';
import { CurrentUser, JwtAuthGuard } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { rpcCall } from '../utils/rpc-call';

@ApiTags('Quiz')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quiz')
export class QuizController {
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
  findByLesson(@Param('lessonId') lessonId: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.QUIZ_FIND_ALL, {
      lessonId,
    });
  }

  @Get('attempts')
  @ApiOperation({ summary: 'Get current user quiz attempts' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attempts retrieved successfully',
    type: [AttemptResponseDTO],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  myAttempts(@CurrentUser('id') userId: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.ATTEMPT_FIND_ALL, {
      userId,
    });
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
  attempt(@Param('id') id: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.ATTEMPT_FIND_ONE, {
      id,
    });
  }

  @Get('attempt/:id/answers')
  @ApiOperation({ summary: 'Get answers for a specific quiz attempt' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Answers retrieved successfully',
    type: [AttemptAnswerResponseDTO],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  attemptAnswers(@Param('id') id: string) {
    return rpcCall(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.ATTEMPT_ANSWER_FIND_ALL,
      { attemptId: id },
    );
  }

  @Post('attempt/:attemptId/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit answers for a quiz attempt' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz attempt submitted and graded',
    type: AttemptResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  submit(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
    @Body() body: SubmitAttemptRequestDTO,
  ) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.ATTEMPT_SUBMIT, {
      userId,
      attemptId,
      answers: body.answers,
    });
  }

  @Post(':quizId/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start a new quiz attempt' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz attempt started successfully',
    type: AttemptResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  start(@CurrentUser('id') userId: string, @Param('quizId') quizId: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.ATTEMPT_START, {
      userId,
      quizId,
    });
  }
}
