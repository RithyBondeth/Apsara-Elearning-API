import { Controller } from '@nestjs/common';
import { EnrollmentRpcService } from '../services/enrollment-rpc.service';

@Controller()
export class EnrollmentRpcController {
  constructor(private readonly enrollmentRpcService: EnrollmentRpcService) {}
}
