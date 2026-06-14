import { Controller } from '@nestjs/common';
import { LessonProgressRpcService } from '../services/lesson-progress-rpc.service';

@Controller()
export class LessonProgressRpcController {
  constructor(
    private readonly lessonProgressRpcService: LessonProgressRpcService,
  ) {}
}
