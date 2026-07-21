/**
 * RPC controller contracts for assessment-service — one per controller.
 */

export interface IChallengeRpcController {
  createChallenge(payload: unknown): Promise<unknown>;
  findChallenges(payload: unknown): Promise<unknown>;
  findChallenge(payload: unknown): Promise<unknown>;
  updateChallenge(payload: unknown): Promise<unknown>;
  removeChallenge(payload: unknown): Promise<unknown>;
  createTestCase(payload: unknown): Promise<unknown>;
  findTestCases(payload: unknown): Promise<unknown>;
  updateTestCase(payload: unknown): Promise<unknown>;
  removeTestCase(payload: unknown): Promise<unknown>;
  createSubmission(payload: unknown): Promise<unknown>;
  findSubmissions(payload: unknown): Promise<unknown>;
  findSubmissionsByChallenge(payload: unknown): Promise<unknown>;
  findSubmission(payload: unknown): Promise<unknown>;
}

export interface IAuthoringRpcController {
  createQuiz(payload: unknown): Promise<unknown>;
  findQuizzes(payload: unknown): Promise<unknown>;
  findQuiz(payload: unknown): Promise<unknown>;
  updateQuiz(payload: unknown): Promise<unknown>;
  removeQuiz(payload: unknown): Promise<unknown>;
  createQuestion(payload: unknown): Promise<unknown>;
  findQuestions(payload: unknown): Promise<unknown>;
  updateQuestion(payload: unknown): Promise<unknown>;
  removeQuestion(payload: unknown): Promise<unknown>;
  reorderQuestions(payload: unknown): Promise<unknown>;
  createOption(payload: unknown): Promise<unknown>;
  findOptions(payload: unknown): Promise<unknown>;
  updateOption(payload: unknown): Promise<unknown>;
  removeOption(payload: unknown): Promise<unknown>;
}

export interface IAttemptRpcController {
  start(payload: unknown): Promise<unknown>;
  submit(payload: unknown): Promise<unknown>;
  findAllByUser(payload: unknown): Promise<unknown>;
  findOne(payload: unknown): Promise<unknown>;
  findByQuiz(payload: unknown): Promise<unknown>;
  findAnswers(payload: unknown): Promise<unknown>;
}
