import { Controller, Inject } from '@nestjs/common';
import { I_ATTEMPT_SERVICE } from '@app/contracts';
import type { IAttemptRpcController, IAttemptService } from '@app/contracts';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ASSESSMENT_SERVICE, AttemptAnswerDTO } from '@app/contracts';

@Controller()
export class AttemptController implements IAttemptRpcController {
  constructor(
    @Inject(I_ATTEMPT_SERVICE) private readonly attempts: IAttemptService,
  ) {}

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.ATTEMPT_START)
  start(@Payload() payload: { userId: string; quizId: string }) {
    return this.attempts.start(payload.userId, payload.quizId);
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.ATTEMPT_SUBMIT)
  submit(
    @Payload()
    payload: {
      userId: string;
      attemptId: string;
      answers: AttemptAnswerDTO[];
    },
  ) {
    return this.attempts.submit(
      payload.userId,
      payload.attemptId,
      payload.answers,
    );
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.ATTEMPT_FIND_ALL)
  findAllByUser(@Payload() payload: { userId: string }) {
    return this.attempts.findAllByUser(payload.userId);
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.ATTEMPT_FIND_ONE)
  findOne(@Payload() payload: { userId: string; id: string }) {
    return this.attempts.findOne(payload.userId, payload.id);
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.ATTEMPT_FIND_BY_QUIZ)
  findByQuiz(@Payload() payload: { userId: string; quizId: string }) {
    return this.attempts.findByQuiz(payload.userId, payload.quizId);
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.ATTEMPT_ANSWER_FIND_ALL)
  findAnswers(@Payload() payload: { userId: string; attemptId: string }) {
    return this.attempts.findAnswers(payload.userId, payload.attemptId);
  }
}
