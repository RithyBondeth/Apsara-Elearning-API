import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AttemptRpcService } from '../services/attempt-rpc.service';
import { ASSESSMENT_SERVICE, AttemptAnswerDTO } from '@app/contracts';
import { idOf } from '../utils/payload';

@Controller()
export class AttemptRpcController {
  constructor(private readonly attempts: AttemptRpcService) {}

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
  findOne(@Payload() payload: string | { id: string }) {
    return this.attempts.findOne(idOf(payload));
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.ATTEMPT_FIND_BY_QUIZ)
  findByQuiz(@Payload() payload: { userId: string; quizId: string }) {
    return this.attempts.findByQuiz(payload.userId, payload.quizId);
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.ATTEMPT_ANSWER_FIND_ALL)
  findAnswers(@Payload() payload: string | { attemptId: string }) {
    const attemptId =
      typeof payload === 'string' ? payload : payload.attemptId;
    return this.attempts.findAnswers(attemptId);
  }
}
