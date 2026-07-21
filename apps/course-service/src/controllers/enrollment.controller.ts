import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { COURSE_SERVICE, I_ENROLLMENT_SERVICE } from '@app/contracts';
import type { IEnrollmentService, IEnrollmentRpcController } from '@app/contracts';

interface UserCoursePayload {
  userId: string;
  courseId: string;
}

@Controller()
export class EnrollmentController implements IEnrollmentRpcController {
  constructor(
    @Inject(I_ENROLLMENT_SERVICE) private readonly enrollmentService: IEnrollmentService,
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
