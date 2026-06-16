import { JwtModule, RabbitmqModule } from '@app/common';
import { Module } from '@nestjs/common';
import { COURSE_SERVICE } from '@app/contracts/constants/services/course-service.constant';
import { CourseController } from './controllers/course.controller';
import { CategoryController } from './controllers/category.controller';
import { LessonController } from './controllers/lesson.controller';
import { EnrollmentController } from './controllers/enrollment.controller';
import { LessonProgressController } from './controllers/lesson-progress.controller';
import { ModuleController } from './controllers/module.controller';

@Module({
  imports: [
    JwtModule,
    RabbitmqModule.register([
      {
        name: COURSE_SERVICE.NAME,
        queueKey: 'rabbitmq.courseQueue',
      },
    ]),
  ],
  controllers: [
    CourseController,
    CategoryController,
    LessonController,
    ModuleController,
    EnrollmentController,
    LessonProgressController,
  ],
})
export class CourseModule {}
