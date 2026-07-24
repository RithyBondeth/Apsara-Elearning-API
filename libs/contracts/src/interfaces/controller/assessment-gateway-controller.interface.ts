import { DeleteResponseDTO } from '../../dtos/common/delete-response.dto';
import {
  AttemptAnswerResponseDTO,
  AttemptResponseDTO,
} from '../../dtos/assessment/attempt.dto';
import {
  OptionResponseDTO,
  QuestionResponseDTO,
  ReorderResponseDTO,
  StartAttemptResponseDTO,
  SubmissionResultResponseDTO,
  SubmitAttemptResponseDTO,
} from '../../dtos/assessment/assessment-responses.dto';
import {
  ChallengeResponseDTO,
  CreateChallengeRequestDTO,
  UpdateChallengeRequestDTO,
} from '../../dtos/assessment/challenge.dto';
import {
  CreateOptionRequestDTO,
  UpdateOptionRequestDTO,
} from '../../dtos/assessment/option.dto';
import {
  CreateQuestionRequestDTO,
  ReorderQuestionsRequestDTO,
  UpdateQuestionRequestDTO,
} from '../../dtos/assessment/question.dto';
import {
  CreateQuizRequestDTO,
  QuizResponseDTO,
  UpdateQuizRequestDTO,
} from '../../dtos/assessment/quiz.dto';
import {
  CreateSubmissionRequestDTO,
  SubmissionResponseDTO,
} from '../../dtos/assessment/submission.dto';
import { SubmitAttemptRequestDTO } from '../../dtos/assessment/attempt.dto';
import {
  CreateTestCaseRequestDTO,
  TestCaseResponseDTO,
  UpdateTestCaseRequestDTO,
} from '../../dtos/assessment/test-case.dto';

/** HTTP gateway controller contracts for the assessment domain. */

// ---- Public (api-gateway) ----

export interface IQuizHttpController {
  findByLesson(lessonId: string): Promise<QuizResponseDTO[]>;
  myAttempts(userId: string): Promise<AttemptResponseDTO[]>;
  attempt(id: string): Promise<AttemptResponseDTO>;
  attemptAnswers(id: string): Promise<AttemptAnswerResponseDTO[]>;
  submit(
    userId: string,
    attemptId: string,
    body: SubmitAttemptRequestDTO,
  ): Promise<SubmitAttemptResponseDTO>;
  start(userId: string, quizId: string): Promise<StartAttemptResponseDTO>;
}

export interface IChallengeHttpController {
  findByLesson(lessonId: string): Promise<ChallengeResponseDTO[]>;
  mySubmissions(userId: string): Promise<SubmissionResponseDTO[]>;
  submission(id: string): Promise<SubmissionResponseDTO>;
  findOne(id: string): Promise<ChallengeResponseDTO>;
  testCases(id: string): Promise<TestCaseResponseDTO[]>;
  submit(
    userId: string,
    challengeId: string,
    dto: CreateSubmissionRequestDTO,
  ): Promise<SubmissionResultResponseDTO>;
}

// ---- Admin (admin-gateway) ----

export interface IAdminAssessmentController {
  createQuiz(
    lessonId: string,
    body: CreateQuizRequestDTO,
  ): Promise<QuizResponseDTO>;
  findQuizzes(lessonId: string): Promise<QuizResponseDTO[]>;
  findQuiz(id: string): Promise<QuizResponseDTO>;
  updateQuiz(id: string, body: UpdateQuizRequestDTO): Promise<QuizResponseDTO>;
  removeQuiz(id: string): Promise<DeleteResponseDTO>;
  createQuestion(
    quizId: string,
    body: CreateQuestionRequestDTO,
  ): Promise<QuestionResponseDTO>;
  findQuestions(quizId: string): Promise<QuestionResponseDTO[]>;
  reorderQuestions(
    body: ReorderQuestionsRequestDTO,
  ): Promise<ReorderResponseDTO>;
  updateQuestion(
    id: string,
    body: UpdateQuestionRequestDTO,
  ): Promise<QuestionResponseDTO>;
  removeQuestion(id: string): Promise<DeleteResponseDTO>;
  createOption(
    questionId: string,
    body: CreateOptionRequestDTO,
  ): Promise<OptionResponseDTO>;
  findOptions(questionId: string): Promise<OptionResponseDTO[]>;
  updateOption(
    id: string,
    body: UpdateOptionRequestDTO,
  ): Promise<OptionResponseDTO>;
  removeOption(id: string): Promise<DeleteResponseDTO>;
}

export interface IAdminChallengeController {
  create(
    lessonId: string,
    body: CreateChallengeRequestDTO,
  ): Promise<ChallengeResponseDTO>;
  findAll(lessonId: string): Promise<ChallengeResponseDTO[]>;
  findOne(id: string): Promise<ChallengeResponseDTO>;
  update(
    id: string,
    body: UpdateChallengeRequestDTO,
  ): Promise<ChallengeResponseDTO>;
  remove(id: string): Promise<DeleteResponseDTO>;
  createTestCase(
    challengeId: string,
    body: CreateTestCaseRequestDTO,
  ): Promise<TestCaseResponseDTO>;
  findTestCases(challengeId: string): Promise<TestCaseResponseDTO[]>;
  updateTestCase(
    id: string,
    body: UpdateTestCaseRequestDTO,
  ): Promise<TestCaseResponseDTO>;
  removeTestCase(id: string): Promise<DeleteResponseDTO>;
}
