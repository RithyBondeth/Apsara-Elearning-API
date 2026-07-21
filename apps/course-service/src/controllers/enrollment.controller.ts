import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { COURSE_SERVICE, I_ENROLLMENT_SERVICE } from '@app/contracts';
import type { IEnrollmentService, IEnrollmentRpcController } from '@app/contracts';

interface UserCoursePayload {
  userId: string;
  courseId: string;
}

@Controller()
export class EnrollmentRpcController implements IEnrollmentRpcController {
  constructor(
    @Inject(I_ENROLLMENT_SERVICE) private readonly enrollmentRpcService: IEnrollmentService,
  ) {}

  @MessagePattern(COURSE_SERVICE.ACTIONS.ENROLL)
  enroll(@Payload() payload: UserCoursePayload) {
    return this.enrollmentRpcService.enroll(payload.userId, payload.courseId);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.UNENROLL)
  unenroll(@Payload() payload: UserCoursePayload) {
    return this.enrollmentRpcService.unenroll(payload.userId, payload.courseId);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.ENROLLMENT_FIND_BY_USER)
  findByUser(@Payload() payload: { userId: string }) {
    return this.enrollmentRpcService.findByUser(payload.userId);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.ENROLLMENT_FIND_BY_COURSE)
  findByCourse(@Payload() payload: string | { courseId: string }) {
    const courseId = typeof payload === 'string' ? payload : payload.courseId;
    return this.enrollmentRpcService.findByCourse(courseId);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.ENROLLMENT_CHECK)
  check(@Payload() payload: UserCoursePayload) {
    return this.enrollmentRpcService.check(payload.userId, payload.courseId);
  }
}
