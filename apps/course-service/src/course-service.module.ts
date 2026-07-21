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
import { CourseRpcController } from './controllers/course.controller';
import { CourseRpcService } from './services/course.service';
import { EnrollmentRpcController } from './controllers/enrollment.controller';
import { EnrollmentRpcService } from './services/enrollment.service';
import { FacultyRpcController } from './controllers/faculty.controller';
import { FacultyRpcService } from './services/faculty.service';
import { GradeLevelRpcController } from './controllers/grade-level.controller';
import { GradeLevelRpcService } from './services/grade-level.service';
import { LessonRpcController } from './controllers/lesson.controller';
import { LessonRpcService } from './services/lesson.service';
import { LessonProgressRpcController } from './controllers/lesson-progress.controller';
import { LessonProgressRpcService } from './services/lesson-progress.service';
import { MajorRpcController } from './controllers/major.controller';
import { MajorRpcService } from './services/major.service';
import { ModuleRpcController } from './controllers/module.controller';
import { ModuleRpcService } from './services/module.service';
import { ProgrammingCategoryRpcController } from './controllers/programming-category.controller';
import { ProgrammingCategoryRpcService } from './services/programming-category.service';
import { SubjectRpcController } from './controllers/subject.controller';
import { SubjectRpcService } from './services/subject.service';
import { CourseHealthController } from './health/health.controller';

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
    CourseRpcController,
    EnrollmentRpcController,
    FacultyRpcController,
    GradeLevelRpcController,
    LessonRpcController,
    LessonProgressRpcController,
    MajorRpcController,
    ModuleRpcController,
    ProgrammingCategoryRpcController,
    SubjectRpcController,
    CourseHealthController,
  ],
  providers: [
    { provide: I_COURSE_SERVICE, useClass: CourseRpcService },
    { provide: I_ENROLLMENT_SERVICE, useClass: EnrollmentRpcService },
    { provide: I_FACULTY_SERVICE, useClass: FacultyRpcService },
    { provide: I_GRADE_LEVEL_SERVICE, useClass: GradeLevelRpcService },
    { provide: I_LESSON_SERVICE, useClass: LessonRpcService },
    { provide: I_LESSON_PROGRESS_SERVICE, useClass: LessonProgressRpcService },
    { provide: I_MAJOR_SERVICE, useClass: MajorRpcService },
    { provide: I_MODULE_SERVICE, useClass: ModuleRpcService },
    { provide: I_PROGRAMMING_CATEGORY_SERVICE, useClass: ProgrammingCategoryRpcService },
    { provide: I_SUBJECT_SERVICE, useClass: SubjectRpcService },
  ],
})
export class CourseServiceModule {}
