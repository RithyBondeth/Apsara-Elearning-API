import { Module } from '@nestjs/common';
import {
  ConfigurationModule,
  HealthModule,
  LoggerModule,
  RabbitmqModule,
} from '@app/common';
import { DatabaseModule } from '@app/database';
import {
  USER_SERVICE,
  I_COURSE_SERVICE,
  I_ENROLLMENT_SERVICE,
  I_FACULTY_SERVICE,
  I_GRADE_LEVEL_SERVICE,
  I_LESSON_SERVICE,
  I_LESSON_PROGRESS_SERVICE,
  I_MAJOR_SERVICE,
  I_MODULE_SERVICE,
  I_PROGRAMMING_CATEGORY_SERVICE,
  I_SUBJECT_SERVICE,
} from '@app/contracts';
import { CourseController } from './controllers/course.controller';
import { CourseService } from './services/course.service';
import { EnrollmentController } from './controllers/enrollment.controller';
import { EnrollmentService } from './services/enrollment.service';
import { FacultyController } from './controllers/faculty.controller';
import { FacultyService } from './services/faculty.service';
import { GradeLevelController } from './controllers/grade-level.controller';
import { GradeLevelService } from './services/grade-level.service';
import { LessonController } from './controllers/lesson.controller';
import { LessonService } from './services/lesson.service';
import { LessonProgressController } from './controllers/lesson-progress.controller';
import { CertificateController } from './controllers/certificate.controller';
import { LessonProgressService } from './services/lesson-progress.service';
import { CertificateService } from './services/certificate.service';
import { MajorController } from './controllers/major.controller';
import { MajorService } from './services/major.service';
import { ModuleController } from './controllers/module.controller';
import { ModuleService } from './services/module.service';
import { ProgrammingCategoryController } from './controllers/programming-category.controller';
import { ProgrammingCategoryService } from './services/programming-category.service';
import { SubjectController } from './controllers/subject.controller';
import { SubjectService } from './services/subject.service';
import { CourseHealthController } from './health/health.controller';
import { CourseEntitlementService, EntitlementService } from '@app/common';

@Module({
  imports: [
    ConfigurationModule,
    LoggerModule,
    DatabaseModule,
    HealthModule,
    // Client used to award XP to users on lesson completion.
    RabbitmqModule.register([
      { name: USER_SERVICE.NAME, queueKey: 'rabbitmq.userQueue' },
    ]),
  ],
  controllers: [
    CourseController,
    EnrollmentController,
    FacultyController,
    GradeLevelController,
    LessonController,
    LessonProgressController,
    CertificateController,
    MajorController,
    ModuleController,
    ProgrammingCategoryController,
    SubjectController,
    CourseHealthController,
  ],
  providers: [
    EntitlementService,
    CertificateService,
    CourseEntitlementService,
    { provide: I_COURSE_SERVICE, useClass: CourseService },
    { provide: I_ENROLLMENT_SERVICE, useClass: EnrollmentService },
    { provide: I_FACULTY_SERVICE, useClass: FacultyService },
    { provide: I_GRADE_LEVEL_SERVICE, useClass: GradeLevelService },
    { provide: I_LESSON_SERVICE, useClass: LessonService },
    { provide: I_LESSON_PROGRESS_SERVICE, useClass: LessonProgressService },
    { provide: I_MAJOR_SERVICE, useClass: MajorService },
    { provide: I_MODULE_SERVICE, useClass: ModuleService },
    {
      provide: I_PROGRAMMING_CATEGORY_SERVICE,
      useClass: ProgrammingCategoryService,
    },
    { provide: I_SUBJECT_SERVICE, useClass: SubjectService },
  ],
})
export class CourseServiceModule {}
