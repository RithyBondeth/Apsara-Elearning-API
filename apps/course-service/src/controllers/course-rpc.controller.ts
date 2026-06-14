import { Controller, Get } from '@nestjs/common';
import { CourseRpcService } from '../services/course-rpc.service';

@Controller()
export class CourseRpcController {
  constructor(private readonly courseService: CourseRpcService) {}

  @Get()
  getHello(): string {
    return this.courseService.getHello();
  }
}
