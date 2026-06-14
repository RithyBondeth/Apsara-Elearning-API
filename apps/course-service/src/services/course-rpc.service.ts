import { Injectable } from '@nestjs/common';

@Injectable()
export class CourseRpcService {
  getHello(): string {
    return 'Hello World!';
  }
}
