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

/** RPC controller contracts for assessment-service. */

export interface IChallengeRpcController {
  createChallenge(
    payload: CreateChallengeRequestDTO & { lessonId: string },
  ): Promise<ChallengeResponseDTO>;
  findChallenges(
    payload: string | { lessonId: string },
  ): Promise<ChallengeResponseDTO[]>;
  findChallenge(
    payload: string | { id: string },
  ): Promise<ChallengeResponseDTO>;
  findPublicChallenges(payload: {
    userId: string;
    lessonId: string;
  }): Promise<ChallengeResponseDTO[]>;
  findPublicChallenge(payload: {
    userId: string;
    id: string;
  }): Promise<ChallengeResponseDTO>;
  updateChallenge(
    payload: UpdateChallengeRequestDTO & { id: string },
  ): Promise<ChallengeResponseDTO>;
  removeChallenge(payload: string | { id: string }): Promise<DeleteResponseDTO>;
  createTestCase(
    payload: CreateTestCaseRequestDTO & { challengeId: string },
  ): Promise<TestCaseResponseDTO>;
  findTestCases(
    payload: string | { challengeId: string; includeHidden?: boolean },
  ): Promise<TestCaseResponseDTO[]>;
  findPublicTestCases(payload: {
    userId: string;
    challengeId: string;
  }): Promise<TestCaseResponseDTO[]>;
  updateTestCase(
    payload: UpdateTestCaseRequestDTO & { id: string },
  ): Promise<TestCaseResponseDTO>;
  removeTestCase(payload: string | { id: string }): Promise<DeleteResponseDTO>;
  createSubmission(
    payload: CreateSubmissionRequestDTO & {
      userId: string;
      challengeId: string;
    },
  ): Promise<SubmissionResultResponseDTO>;
  findSubmissions(payload: {
    userId: string;
  }): Promise<SubmissionResponseDTO[]>;
  findSubmissionsByChallenge(payload: {
    userId: string;
    challengeId: string;
  }): Promise<SubmissionResponseDTO[]>;
  findSubmission(payload: {
    userId: string;
    id: string;
  }): Promise<SubmissionResponseDTO>;
}

export interface IAuthoringRpcController {
  createQuiz(
    payload: CreateQuizRequestDTO & { lessonId: string },
  ): Promise<QuizResponseDTO>;
  findQuizzes(
    payload: string | { lessonId: string },
  ): Promise<QuizResponseDTO[]>;
  findQuiz(payload: string | { id: string }): Promise<QuizResponseDTO>;
  updateQuiz(
    payload: UpdateQuizRequestDTO & { id: string },
  ): Promise<QuizResponseDTO>;
  removeQuiz(payload: string | { id: string }): Promise<DeleteResponseDTO>;
  createQuestion(
    payload: CreateQuestionRequestDTO & { quizId: string },
  ): Promise<QuestionResponseDTO>;
  findQuestions(
    payload: string | { quizId: string },
  ): Promise<QuestionResponseDTO[]>;
  updateQuestion(
    payload: UpdateQuestionRequestDTO & { id: string },
  ): Promise<QuestionResponseDTO>;
  removeQuestion(payload: string | { id: string }): Promise<DeleteResponseDTO>;
  reorderQuestions(payload: {
    orderedIds: string[];
  }): Promise<ReorderResponseDTO>;
  createOption(
    payload: CreateOptionRequestDTO & { questionId: string },
  ): Promise<OptionResponseDTO>;
  findOptions(
    payload: string | { questionId: string },
  ): Promise<OptionResponseDTO[]>;
  updateOption(
    payload: UpdateOptionRequestDTO & { id: string },
  ): Promise<OptionResponseDTO>;
  removeOption(payload: string | { id: string }): Promise<DeleteResponseDTO>;
}

export interface IAttemptRpcController {
  start(payload: {
    userId: string;
    quizId: string;
  }): Promise<StartAttemptResponseDTO>;
  submit(payload: {
    userId: string;
    attemptId: string;
    answers: AttemptAnswerDTO[];
  }): Promise<SubmitAttemptResponseDTO>;
  findAllByUser(payload: { userId: string }): Promise<AttemptResponseDTO[]>;
  findOne(payload: { userId: string; id: string }): Promise<AttemptResponseDTO>;
  findByQuiz(payload: {
    userId: string;
    quizId: string;
  }): Promise<AttemptResponseDTO[]>;
  findAnswers(payload: {
    userId: string;
    attemptId: string;
  }): Promise<AttemptAnswerResponseDTO[]>;
}
