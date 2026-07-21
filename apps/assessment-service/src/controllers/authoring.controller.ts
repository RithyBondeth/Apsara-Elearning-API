import { Controller, Inject } from '@nestjs/common';
import { I_AUTHORING_SERVICE } from '@app/contracts';
import type { IAuthoringRpcController, IAuthoringService } from '@app/contracts';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  ASSESSMENT_SERVICE,
  CreateOptionRequestDTO,
  CreateQuestionRequestDTO,
  CreateQuizRequestDTO,
  UpdateOptionRequestDTO,
  UpdateQuestionRequestDTO,
  UpdateQuizRequestDTO,
} from '@app/contracts';
import { idOf, splitUpdate } from '../utils/payload';

@Controller()
export class AuthoringRpcController implements IAuthoringRpcController {
  constructor(@Inject(I_AUTHORING_SERVICE) private readonly authoring: IAuthoringService) {}

  // ---- Quiz ----
  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.QUIZ_CREATE)
  createQuiz(@Payload() payload: CreateQuizRequestDTO & { lessonId: string }) {
    const { lessonId, ...dto } = payload;
    return this.authoring.createQuiz(lessonId, dto);
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.QUIZ_FIND_ALL)
  findQuizzes(@Payload() payload: string | { lessonId: string }) {
    const lessonId = typeof payload === 'string' ? payload : payload.lessonId;
    return this.authoring.findQuizzesByLesson(lessonId);
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.QUIZ_FIND_ONE)
  findQuiz(@Payload() payload: string | { id: string }) {
    return this.authoring.findQuiz(idOf(payload));
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.QUIZ_UPDATE)
  updateQuiz(@Payload() payload: UpdateQuizRequestDTO & { id: string }) {
    const { id, data } = splitUpdate(payload);
    return this.authoring.updateQuiz(id, data);
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.QUIZ_DELETE)
  removeQuiz(@Payload() payload: string | { id: string }) {
    return this.authoring.removeQuiz(idOf(payload));
  }

  // ---- Question ----
  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.QUESTION_CREATE)
  createQuestion(
    @Payload() payload: CreateQuestionRequestDTO & { quizId: string },
  ) {
    const { quizId, ...dto } = payload;
    return this.authoring.createQuestion(quizId, dto);
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.QUESTION_FIND_ALL)
  findQuestions(@Payload() payload: string | { quizId: string }) {
    const quizId = typeof payload === 'string' ? payload : payload.quizId;
    return this.authoring.findQuestionsByQuiz(quizId);
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.QUESTION_UPDATE)
  updateQuestion(
    @Payload() payload: UpdateQuestionRequestDTO & { id: string },
  ) {
    const { id, data } = splitUpdate(payload);
    return this.authoring.updateQuestion(id, data);
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.QUESTION_DELETE)
  removeQuestion(@Payload() payload: string | { id: string }) {
    return this.authoring.removeQuestion(idOf(payload));
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.QUESTION_REORDER)
  reorderQuestions(@Payload() payload: { orderedIds: string[] }) {
    return this.authoring.reorderQuestions(payload.orderedIds);
  }

  // ---- Option ----
  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.OPTION_CREATE)
  createOption(
    @Payload() payload: CreateOptionRequestDTO & { questionId: string },
  ) {
    const { questionId, ...dto } = payload;
    return this.authoring.createOption(questionId, dto);
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.OPTION_FIND_ALL)
  findOptions(@Payload() payload: string | { questionId: string }) {
    const questionId =
      typeof payload === 'string' ? payload : payload.questionId;
    return this.authoring.findOptionsByQuestion(questionId);
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.OPTION_UPDATE)
  updateOption(@Payload() payload: UpdateOptionRequestDTO & { id: string }) {
    const { id, data } = splitUpdate(payload);
    return this.authoring.updateOption(id, data);
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.OPTION_DELETE)
  removeOption(@Payload() payload: string | { id: string }) {
    return this.authoring.removeOption(idOf(payload));
  }
}
