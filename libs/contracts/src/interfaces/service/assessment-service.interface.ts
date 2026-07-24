import { DeleteResponseDTO } from '../../dtos/common/delete-response.dto';
import {
  AttemptAnswerDTO,
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
import {
  CreateTestCaseRequestDTO,
  TestCaseResponseDTO,
  UpdateTestCaseRequestDTO,
} from '../../dtos/assessment/test-case.dto';

/** DI tokens + service contracts for assessment-service. */

export const I_ATTEMPT_SERVICE = 'IAttemptService';
export const I_AUTHORING_SERVICE = 'IAuthoringService';
export const I_CHALLENGE_SERVICE = 'IChallengeService';
export const I_SUBMISSION_SERVICE = 'ISubmissionService';

export interface IAttemptService {
  start(userId: string, quizId: string): Promise<StartAttemptResponseDTO>;
  submit(
    userId: string,
    attemptId: string,
    answers: AttemptAnswerDTO[],
  ): Promise<SubmitAttemptResponseDTO>;
  findAllByUser(userId: string): Promise<AttemptResponseDTO[]>;
  findOne(id: string): Promise<AttemptResponseDTO>;
  findByQuiz(userId: string, quizId: string): Promise<AttemptResponseDTO[]>;
  findAnswers(attemptId: string): Promise<AttemptAnswerResponseDTO[]>;
}

export interface IAuthoringService {
  createQuiz(
    lessonId: string,
    dto: CreateQuizRequestDTO,
  ): Promise<QuizResponseDTO>;
  findQuizzesByLesson(lessonId: string): Promise<QuizResponseDTO[]>;
  findQuiz(id: string): Promise<QuizResponseDTO>;
  updateQuiz(id: string, dto: UpdateQuizRequestDTO): Promise<QuizResponseDTO>;
  removeQuiz(id: string): Promise<DeleteResponseDTO>;
  createQuestion(
    quizId: string,
    dto: CreateQuestionRequestDTO,
  ): Promise<QuestionResponseDTO>;
  findQuestionsByQuiz(quizId: string): Promise<QuestionResponseDTO[]>;
  updateQuestion(
    id: string,
    dto: UpdateQuestionRequestDTO,
  ): Promise<QuestionResponseDTO>;
  removeQuestion(id: string): Promise<DeleteResponseDTO>;
  reorderQuestions(orderedIds: string[]): Promise<ReorderResponseDTO>;
  createOption(
    questionId: string,
    dto: CreateOptionRequestDTO,
  ): Promise<OptionResponseDTO>;
  findOptionsByQuestion(questionId: string): Promise<OptionResponseDTO[]>;
  updateOption(
    id: string,
    dto: UpdateOptionRequestDTO,
  ): Promise<OptionResponseDTO>;
  removeOption(id: string): Promise<DeleteResponseDTO>;
}

export interface IChallengeService {
  createChallenge(
    lessonId: string,
    dto: CreateChallengeRequestDTO,
  ): Promise<ChallengeResponseDTO>;
  findChallengesByLesson(lessonId: string): Promise<ChallengeResponseDTO[]>;
  findChallenge(id: string): Promise<ChallengeResponseDTO>;
  updateChallenge(
    id: string,
    dto: UpdateChallengeRequestDTO,
  ): Promise<ChallengeResponseDTO>;
  removeChallenge(id: string): Promise<DeleteResponseDTO>;
  createTestCase(
    challengeId: string,
    dto: CreateTestCaseRequestDTO,
  ): Promise<TestCaseResponseDTO>;
  findTestCases(
    challengeId: string,
    includeHidden?: boolean,
  ): Promise<TestCaseResponseDTO[]>;
  updateTestCase(
    id: string,
    dto: UpdateTestCaseRequestDTO,
  ): Promise<TestCaseResponseDTO>;
  removeTestCase(id: string): Promise<DeleteResponseDTO>;
}

export interface ISubmissionService {
  create(
    userId: string,
    challengeId: string,
    dto: CreateSubmissionRequestDTO,
  ): Promise<SubmissionResultResponseDTO>;
  findAllByUser(userId: string): Promise<SubmissionResponseDTO[]>;
  findByChallenge(
    userId: string,
    challengeId: string,
  ): Promise<SubmissionResponseDTO[]>;
  findOne(id: string): Promise<SubmissionResponseDTO>;
}
