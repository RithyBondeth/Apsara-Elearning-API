import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { COURSE_SERVICE } from '@app/contracts';
import { CertificateService } from '../services/certificate.service';

@Controller()
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @MessagePattern(COURSE_SERVICE.ACTIONS.CERTIFICATE_ISSUE)
  issue(@Payload() payload: { userId: string; courseId: string }) {
    return this.certificateService.issue(payload.userId, payload.courseId);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.CERTIFICATE_FIND_BY_USER)
  findByUser(@Payload() payload: string | { userId: string }) {
    const userId = typeof payload === 'string' ? payload : payload.userId;
    return this.certificateService.findByUser(userId);
  }

  @MessagePattern(COURSE_SERVICE.ACTIONS.CERTIFICATE_VERIFY)
  verify(@Payload() payload: string | { code: string }) {
    const code = typeof payload === 'string' ? payload : payload.code;
    return this.certificateService.verify(code);
  }
}
