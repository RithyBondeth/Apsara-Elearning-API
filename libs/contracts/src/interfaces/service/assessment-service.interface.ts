/**
 * DI tokens + service contracts for assessment-service.
 * Loose signatures — Drizzle rows re-typed at the gateway via rpcCall<T>.
 */

export const I_ATTEMPT_SERVICE = 'IAttemptService';
export const I_AUTHORING_SERVICE = 'IAuthoringService';
export const I_CHALLENGE_SERVICE = 'IChallengeService';
export const I_SUBMISSION_SERVICE = 'ISubmissionService';

export interface IAttemptService {
  start(...args: any[]): Promise<unknown>;
  submit(...args: any[]): Promise<unknown>;
  findAllByUser(...args: any[]): Promise<unknown>;
  findOne(...args: any[]): Promise<unknown>;
  findByQuiz(...args: any[]): Promise<unknown>;
  findAnswers(...args: any[]): Promise<unknown>;
}

export interface IAuthoringService {
  createQuiz(...args: any[]): Promise<unknown>;
  findQuizzesByLesson(...args: any[]): Promise<unknown>;
  findQuiz(...args: any[]): Promise<unknown>;
  updateQuiz(...args: any[]): Promise<unknown>;
  removeQuiz(...args: any[]): Promise<unknown>;
  createQuestion(...args: any[]): Promise<unknown>;
  findQuestionsByQuiz(...args: any[]): Promise<unknown>;
  updateQuestion(...args: any[]): Promise<unknown>;
  removeQuestion(...args: any[]): Promise<unknown>;
  reorderQuestions(...args: any[]): Promise<unknown>;
  createOption(...args: any[]): Promise<unknown>;
  findOptionsByQuestion(...args: any[]): Promise<unknown>;
  updateOption(...args: any[]): Promise<unknown>;
  removeOption(...args: any[]): Promise<unknown>;
}

export interface IChallengeService {
  createChallenge(...args: any[]): Promise<unknown>;
  findChallengesByLesson(...args: any[]): Promise<unknown>;
  findChallenge(...args: any[]): Promise<unknown>;
  updateChallenge(...args: any[]): Promise<unknown>;
  removeChallenge(...args: any[]): Promise<unknown>;
  createTestCase(...args: any[]): Promise<unknown>;
  findTestCases(...args: any[]): Promise<unknown>;
  updateTestCase(...args: any[]): Promise<unknown>;
  removeTestCase(...args: any[]): Promise<unknown>;
}

export interface ISubmissionService {
  create(...args: any[]): Promise<unknown>;
  findAllByUser(...args: any[]): Promise<unknown>;
  findByChallenge(...args: any[]): Promise<unknown>;
  findOne(...args: any[]): Promise<unknown>;
}
