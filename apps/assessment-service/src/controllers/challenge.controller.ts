import { Controller, Inject } from '@nestjs/common';
import { I_CHALLENGE_SERVICE, I_SUBMISSION_SERVICE } from '@app/contracts';
import type {
  IChallengeRpcController,
  IChallengeService,
  ISubmissionService,
} from '@app/contracts';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  ASSESSMENT_SERVICE,
  CreateChallengeRequestDTO,
  CreateSubmissionRequestDTO,
  CreateTestCaseRequestDTO,
  UpdateChallengeRequestDTO,
  UpdateTestCaseRequestDTO,
} from '@app/contracts';
import { idOf, splitUpdate } from '@app/utils';

@Controller()
export class ChallengeController implements IChallengeRpcController {
  constructor(
    @Inject(I_CHALLENGE_SERVICE) private readonly challenges: IChallengeService,
    @Inject(I_SUBMISSION_SERVICE)
    private readonly submissions: ISubmissionService,
  ) {}

  // ---- Challenge ----
  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.CHALLENGE_CREATE)
  createChallenge(
    @Payload() payload: CreateChallengeRequestDTO & { lessonId: string },
  ) {
    const { lessonId, ...dto } = payload;
    return this.challenges.createChallenge(lessonId, dto);
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.CHALLENGE_FIND_ALL)
  findChallenges(@Payload() payload: string | { lessonId: string }) {
    const lessonId = typeof payload === 'string' ? payload : payload.lessonId;
    return this.challenges.findChallengesByLesson(lessonId);
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.CHALLENGE_FIND_PUBLIC_ALL)
  findPublicChallenges(
    @Payload() payload: { userId: string; lessonId: string },
  ) {
    return this.challenges.findPublicChallengesByLesson(
      payload.lessonId,
      payload.userId,
    );
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.CHALLENGE_FIND_ONE)
  findChallenge(@Payload() payload: string | { id: string }) {
    return this.challenges.findChallenge(idOf(payload));
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.CHALLENGE_FIND_PUBLIC_ONE)
  findPublicChallenge(@Payload() payload: { userId: string; id: string }) {
    return this.challenges.findPublicChallenge(payload.id, payload.userId);
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.CHALLENGE_UPDATE)
  updateChallenge(
    @Payload() payload: UpdateChallengeRequestDTO & { id: string },
  ) {
    const { id, data } = splitUpdate(payload);
    return this.challenges.updateChallenge(id, data);
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.CHALLENGE_DELETE)
  removeChallenge(@Payload() payload: string | { id: string }) {
    return this.challenges.removeChallenge(idOf(payload));
  }

  // ---- Test cases ----
  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.TEST_CASE_CREATE)
  createTestCase(
    @Payload() payload: CreateTestCaseRequestDTO & { challengeId: string },
  ) {
    const { challengeId, ...dto } = payload;
    return this.challenges.createTestCase(challengeId, dto);
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.TEST_CASE_FIND_ALL)
  findTestCases(
    @Payload()
    payload: string | { challengeId: string; includeHidden?: boolean },
  ) {
    if (typeof payload === 'string') {
      return this.challenges.findTestCases(payload, false);
    }
    return this.challenges.findTestCases(
      payload.challengeId,
      payload.includeHidden ?? false,
    );
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.TEST_CASE_FIND_PUBLIC_ALL)
  findPublicTestCases(
    @Payload() payload: { userId: string; challengeId: string },
  ) {
    return this.challenges.findPublicTestCases(
      payload.challengeId,
      payload.userId,
    );
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.TEST_CASE_UPDATE)
  updateTestCase(
    @Payload() payload: UpdateTestCaseRequestDTO & { id: string },
  ) {
    const { id, data } = splitUpdate(payload);
    return this.challenges.updateTestCase(id, data);
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.TEST_CASE_DELETE)
  removeTestCase(@Payload() payload: string | { id: string }) {
    return this.challenges.removeTestCase(idOf(payload));
  }

  // ---- Submissions ----
  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.SUBMISSION_CREATE)
  createSubmission(
    @Payload()
    payload: CreateSubmissionRequestDTO & {
      userId: string;
      challengeId: string;
    },
  ) {
    const { userId, challengeId, ...dto } = payload;
    return this.submissions.create(userId, challengeId, dto);
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.SUBMISSION_FIND_ALL)
  findSubmissions(@Payload() payload: { userId: string }) {
    return this.submissions.findAllByUser(payload.userId);
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.SUBMISSION_FIND_BY_CHALLENGE)
  findSubmissionsByChallenge(
    @Payload() payload: { userId: string; challengeId: string },
  ) {
    return this.submissions.findByChallenge(
      payload.userId,
      payload.challengeId,
    );
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.SUBMISSION_FIND_ONE)
  findSubmission(@Payload() payload: { userId: string; id: string }) {
    return this.submissions.findOne(payload.userId, payload.id);
  }
}
