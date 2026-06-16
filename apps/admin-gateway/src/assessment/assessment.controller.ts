import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ASSESSMENT_SERVICE,
  CreateOptionRequestDTO,
  CreateQuestionRequestDTO,
  CreateQuizRequestDTO,
  ReorderQuestionsRequestDTO,
  UpdateOptionRequestDTO,
  UpdateQuestionRequestDTO,
  UpdateQuizRequestDTO,
} from '@app/contracts';
import { rpcCall } from '../utils/rpc-call';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Assessment (Admin)')
@ApiBearerAuth()
@Controller()
export class AssessmentController {
  constructor(
    @Inject(ASSESSMENT_SERVICE.NAME) private readonly client: ClientProxy,
  ) {}

  // ---- Quiz ----
  @Post('lessons/:lessonId/quizzes')
  createQuiz(
    @Param('lessonId') lessonId: string,
    @Body() body: CreateQuizRequestDTO,
  ) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.QUIZ_CREATE, {
      lessonId,
      ...body,
    });
  }

  @Get('lessons/:lessonId/quizzes')
  findQuizzes(@Param('lessonId') lessonId: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.QUIZ_FIND_ALL, {
      lessonId,
    });
  }

  @Get('quizzes/:id')
  findQuiz(@Param('id') id: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.QUIZ_FIND_ONE, {
      id,
    });
  }

  @Patch('quizzes/:id')
  updateQuiz(@Param('id') id: string, @Body() body: UpdateQuizRequestDTO) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.QUIZ_UPDATE, {
      id,
      ...body,
    });
  }

  @Delete('quizzes/:id')
  removeQuiz(@Param('id') id: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.QUIZ_DELETE, { id });
  }

  // ---- Question ----
  @Post('quizzes/:quizId/questions')
  createQuestion(
    @Param('quizId') quizId: string,
    @Body() body: CreateQuestionRequestDTO,
  ) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.QUESTION_CREATE, {
      quizId,
      ...body,
    });
  }

  @Get('quizzes/:quizId/questions')
  findQuestions(@Param('quizId') quizId: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.QUESTION_FIND_ALL, {
      quizId,
    });
  }

  // Declared before `questions/:id` so the literal path wins.
  @Patch('questions/reorder')
  reorderQuestions(@Body() body: ReorderQuestionsRequestDTO) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.QUESTION_REORDER, {
      orderedIds: body.orderedIds,
    });
  }

  @Patch('questions/:id')
  updateQuestion(
    @Param('id') id: string,
    @Body() body: UpdateQuestionRequestDTO,
  ) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.QUESTION_UPDATE, {
      id,
      ...body,
    });
  }

  @Delete('questions/:id')
  removeQuestion(@Param('id') id: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.QUESTION_DELETE, {
      id,
    });
  }

  // ---- Option ----
  @Post('questions/:questionId/options')
  createOption(
    @Param('questionId') questionId: string,
    @Body() body: CreateOptionRequestDTO,
  ) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.OPTION_CREATE, {
      questionId,
      ...body,
    });
  }

  @Get('questions/:questionId/options')
  findOptions(@Param('questionId') questionId: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.OPTION_FIND_ALL, {
      questionId,
    });
  }

  @Patch('options/:id')
  updateOption(@Param('id') id: string, @Body() body: UpdateOptionRequestDTO) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.OPTION_UPDATE, {
      id,
      ...body,
    });
  }

  @Delete('options/:id')
  removeOption(@Param('id') id: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.OPTION_DELETE, {
      id,
    });
  }
}
