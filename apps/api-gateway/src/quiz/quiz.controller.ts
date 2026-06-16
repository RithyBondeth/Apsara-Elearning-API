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
import { ASSESSMENT_SERVICE, SubmitAttemptRequestDTO } from '@app/contracts';
import { CurrentUser, JwtAuthGuard } from '@app/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  findByLesson(@Param('lessonId') lessonId: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.QUIZ_FIND_ALL, {
      lessonId,
    });
  }

  @Get('attempts')
  myAttempts(@CurrentUser('id') userId: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.ATTEMPT_FIND_ALL, {
      userId,
    });
  }

  @Get('attempt/:id')
  attempt(@Param('id') id: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.ATTEMPT_FIND_ONE, {
      id,
    });
  }

  @Get('attempt/:id/answers')
  attemptAnswers(@Param('id') id: string) {
    return rpcCall(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.ATTEMPT_ANSWER_FIND_ALL,
      { attemptId: id },
    );
  }

  // Declared before `:quizId/start` so the literal path wins.
  @Post('attempt/:attemptId/submit')
  @HttpCode(HttpStatus.OK)
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
  start(
    @CurrentUser('id') userId: string,
    @Param('quizId') quizId: string,
  ) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.ATTEMPT_START, {
      userId,
      quizId,
    });
  }
}
