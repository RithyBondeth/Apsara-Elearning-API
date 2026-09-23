import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  COURSE_SERVICE,
  CONTINUE_DEFAULT_LIMIT,
  CONTINUE_MAX_LIMIT,
  I_ENROLLMENT_SERVICE,
} from '@app/contracts';
import type {
  IEnrollmentService,
  IEnrollmentRpcController,
} from '@app/contracts';

interface UserCoursePayload {
  userId: string;
  courseId: string;
}

@Controller()
export class EnrollmentController implements IEnrollmentRpcController {
  constructor(
    @Inject(I_ENROLLMENT_SERVICE)
    private readonly enrollmentService: IEnrollmentService,
  ) {}

  @MessagePattern(COURSE_SERVICE.ACTIONS.ENROLL)
  enroll(@Payload() payload: UserCoursePayload) {
    return this.enrollmentService.enroll(payload.userId, payload.courseId);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.UNENROLL)
  unenroll(@Payload() payload: UserCoursePayload) {
    return this.enrollmentService.unenroll(payload.userId, payload.courseId);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.ENROLLMENT_FIND_BY_USER)
  findByUser(@Payload() payload: { userId: string }) {
    return this.enrollmentService.findByUser(payload.userId);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.ENROLLMENT_CONTINUE)
  continueLearning(@Payload() payload: { userId: string; limit?: number }) {
    // Validated at the gateway, but any service can call the action — clamp.
    const requested = Number(payload.limit ?? CONTINUE_DEFAULT_LIMIT);
    const limit = Number.isFinite(requested)
      ? Math.min(Math.max(Math.trunc(requested), 1), CONTINUE_MAX_LIMIT)
      : CONTINUE_DEFAULT_LIMIT;
    return this.enrollmentService.continueLearning(payload.userId, limit);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.ENROLLMENT_FIND_BY_COURSE)
  findByCourse(@Payload() payload: string | { courseId: string }) {
    const courseId = typeof payload === 'string' ? payload : payload.courseId;
    return this.enrollmentService.findByCourse(courseId);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.ENROLLMENT_CHECK)
  check(@Payload() payload: UserCoursePayload) {
    return this.enrollmentService.check(payload.userId, payload.courseId);
  }
}
