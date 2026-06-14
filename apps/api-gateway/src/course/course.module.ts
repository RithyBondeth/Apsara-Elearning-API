import { RabbitmqModule } from '@app/common';
import { Module } from '@nestjs/common';
import { COURSE_SERVICE } from '@app/contracts/constants/services/course-service.constant';
import { CourseController } from './course.controller';

@Module({
  imports: [
    RabbitmqModule.register([
      {
        name: COURSE_SERVICE.NAME,
        queueKey: 'rabbitmq.courseQueue',
      },
    ]),
  ],
  controllers: [CourseController],
})
export class CourseModule {}
