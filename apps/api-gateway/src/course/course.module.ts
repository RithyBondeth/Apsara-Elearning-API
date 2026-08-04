import { JwtModule, RabbitmqModule } from '@app/common';
import { Module } from '@nestjs/common';
import { COURSE_SERVICE } from '@app/contracts/constants/services/course-service.constant';
import { CourseController } from './controllers/course.controller';
import { SubjectController } from './controllers/subject.controller';
import { ProgrammingCategoryController } from './controllers/programming-category.controller';
import { StructureController } from './controllers/structure.controller';
import { LessonController } from './controllers/lesson.controller';
import { EnrollmentController } from './controllers/enrollment.controller';
import { LessonProgressController } from './controllers/lesson-progress.controller';
import { CertificateController } from './controllers/certificate.controller';
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
    SubjectController,
    ProgrammingCategoryController,
    StructureController,
    LessonController,
    ModuleController,
    EnrollmentController,
    LessonProgressController,
    CertificateController,
  ],
})
export class CourseModule {}
