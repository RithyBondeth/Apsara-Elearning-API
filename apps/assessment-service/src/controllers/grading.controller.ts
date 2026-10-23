import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  ASSESSMENT_SERVICE,
  GradeAnswerRequestDTO,
  GradingStatus,
} from '@app/contracts';
import { GradingService } from '../services/grading.service';

/** Admin manual grading — reached only through the admin gateway. */
@Controller()
export class GradingController {
  constructor(private readonly grading: GradingService) {}

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.GRADING_LIST)
  list(@Payload() payload: { status?: GradingStatus; limit?: number }) {
    return this.grading.list(payload.status, payload.limit);
  }

  @MessagePattern(ASSESSMENT_SERVICE.ACTIONS.GRADING_GRADE)
  grade(
    @Payload()
    payload: { adminId: string; answerId: string } & GradeAnswerRequestDTO,
  ) {
    return this.grading.grade(payload.adminId, payload.answerId, {
      points: payload.points,
      feedback: payload.feedback,
    });
  }
}
