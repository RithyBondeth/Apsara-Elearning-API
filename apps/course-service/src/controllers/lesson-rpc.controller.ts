import { Controller } from '@nestjs/common';
import { LessonRpcService } from '../services/lesson-rpc.service';

@Controller()
export class LessonRpcController {
  constructor(private readonly lessonRpcService: LessonRpcService) {}
}
