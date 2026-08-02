import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
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
  DeleteResponseDTO,
  IAdminAssessmentController,
  OptionResponseDTO,
  QuestionResponseDTO,
  QuizResponseDTO,
  ReorderQuestionsRequestDTO,
  ReorderResponseDTO,
  UpdateOptionRequestDTO,
  UpdateQuestionRequestDTO,
  UpdateQuizRequestDTO,
} from '@app/contracts';
import { rpcCall } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Assessment (Admin)')
@ApiBearerAuth()
@Controller()
export class AssessmentController implements IAdminAssessmentController {
  constructor(
    @Inject(ASSESSMENT_SERVICE.NAME) private readonly client: ClientProxy,
  ) {}

  // ---- Quiz ----
  @Post('lessons/:lessonId/quizzes')
  @ApiOperation({ summary: 'Create a new quiz for a lesson' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Quiz created' })
  createQuiz(
    @Param('lessonId') lessonId: string,
    @Body() body: CreateQuizRequestDTO,
  ): Promise<QuizResponseDTO> {
    return rpcCall<QuizResponseDTO>(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.QUIZ_CREATE,
      { lessonId, ...body },
    );
  }

  @Get('lessons/:lessonId/quizzes')
  @ApiOperation({ summary: 'Get all quizzes for a lesson' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Quizzes retrieved' })
  findQuizzes(@Param('lessonId') lessonId: string): Promise<QuizResponseDTO[]> {
    return rpcCall<QuizResponseDTO[]>(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.QUIZ_FIND_ALL,
      { lessonId },
    );
  }

  @Get('quizzes/:id')
  @ApiOperation({ summary: 'Get a quiz by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Quiz retrieved' })
  findQuiz(@Param('id') id: string): Promise<QuizResponseDTO> {
    return rpcCall<QuizResponseDTO>(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.QUIZ_FIND_ONE,
      { id },
    );
  }

  @Patch('quizzes/:id')
  @ApiOperation({ summary: 'Update a quiz' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Quiz updated' })
  updateQuiz(
    @Param('id') id: string,
    @Body() body: UpdateQuizRequestDTO,
  ): Promise<QuizResponseDTO> {
    return rpcCall<QuizResponseDTO>(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.QUIZ_UPDATE,
      { id, ...body },
    );
  }

  @Delete('quizzes/:id')
  @ApiOperation({ summary: 'Delete a quiz' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Quiz deleted' })
  removeQuiz(@Param('id') id: string): Promise<DeleteResponseDTO> {
    return rpcCall<DeleteResponseDTO>(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.QUIZ_DELETE,
      { id },
    );
  }

  // ---- Question ----
  @Post('quizzes/:quizId/questions')
  @ApiOperation({ summary: 'Create a new question for a quiz' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Question created' })
  createQuestion(
    @Param('quizId') quizId: string,
    @Body() body: CreateQuestionRequestDTO,
  ): Promise<QuestionResponseDTO> {
    return rpcCall<QuestionResponseDTO>(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.QUESTION_CREATE,
      { quizId, ...body },
    );
  }

  @Get('quizzes/:quizId/questions')
  @ApiOperation({ summary: 'Get all questions for a quiz' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Questions retrieved' })
  findQuestions(
    @Param('quizId') quizId: string,
  ): Promise<QuestionResponseDTO[]> {
    return rpcCall<QuestionResponseDTO[]>(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.QUESTION_FIND_ALL,
      { quizId },
    );
  }

  @Patch('questions/reorder')
  @ApiOperation({ summary: 'Reorder questions within a quiz' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Questions reordered' })
  reorderQuestions(
    @Body() body: ReorderQuestionsRequestDTO,
  ): Promise<ReorderResponseDTO> {
    return rpcCall<ReorderResponseDTO>(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.QUESTION_REORDER,
      { orderedIds: body.orderedIds },
    );
  }

  @Patch('questions/:id')
  @ApiOperation({ summary: 'Update a question' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Question updated' })
  updateQuestion(
    @Param('id') id: string,
    @Body() body: UpdateQuestionRequestDTO,
  ): Promise<QuestionResponseDTO> {
    return rpcCall<QuestionResponseDTO>(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.QUESTION_UPDATE,
      { id, ...body },
    );
  }

  @Delete('questions/:id')
  @ApiOperation({ summary: 'Delete a question' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Question deleted' })
  removeQuestion(@Param('id') id: string): Promise<DeleteResponseDTO> {
    return rpcCall<DeleteResponseDTO>(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.QUESTION_DELETE,
      { id },
    );
  }

  // ---- Option ----
  @Post('questions/:questionId/options')
  @ApiOperation({ summary: 'Create a new option for a question' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Option created' })
  createOption(
    @Param('questionId') questionId: string,
    @Body() body: CreateOptionRequestDTO,
  ): Promise<OptionResponseDTO> {
    return rpcCall<OptionResponseDTO>(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.OPTION_CREATE,
      { questionId, ...body },
    );
  }

  @Get('questions/:questionId/options')
  @ApiOperation({ summary: 'Get all options for a question' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Options retrieved' })
  findOptions(
    @Param('questionId') questionId: string,
  ): Promise<OptionResponseDTO[]> {
    return rpcCall<OptionResponseDTO[]>(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.OPTION_FIND_ALL,
      { questionId },
    );
  }

  @Patch('options/:id')
  @ApiOperation({ summary: 'Update an option' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Option updated' })
  updateOption(
    @Param('id') id: string,
    @Body() body: UpdateOptionRequestDTO,
  ): Promise<OptionResponseDTO> {
    return rpcCall<OptionResponseDTO>(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.OPTION_UPDATE,
      { id, ...body },
    );
  }

  @Delete('options/:id')
  @ApiOperation({ summary: 'Delete an option' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Option deleted' })
  removeOption(@Param('id') id: string): Promise<DeleteResponseDTO> {
    return rpcCall<DeleteResponseDTO>(
      this.client,
      ASSESSMENT_SERVICE.ACTIONS.OPTION_DELETE,
      { id },
    );
  }
}
