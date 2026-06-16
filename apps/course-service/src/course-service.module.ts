import { Module } from '@nestjs/common';
import { ConfigurationModule, LoggerModule, RabbitmqModule } from '@app/common';
import { DatabaseModule } from '@app/database';
import { USER_SERVICE } from '@app/contracts';
import { CourseRpcController } from './controllers/course-rpc.controller';
import { CourseRpcService } from './services/course-rpc.service';
import { CategoryRpcController } from './controllers/category-rpc.controller';
import { CategoryRpcService } from './services/category-rpc.service';
import { LessonRpcController } from './controllers/lesson-rpc.controller';
import { LessonRpcService } from './services/lesson-rpc.service';
import { ModuleRpcController } from './controllers/module-rpc.controller';
import { ModuleRpcService } from './services/module-rpc.service';
import { EnrollmentRpcController } from './controllers/enrollment-rpc.controller';
import { EnrollmentRpcService } from './services/enrollment-rpc.service';
import { LessonProgressRpcController } from './controllers/lesson-progress-rpc.controller';
import { LessonProgressRpcService } from './services/lesson-progress-rpc.service';

@Module({
  imports: [
    ConfigurationModule,
    LoggerModule,
    DatabaseModule,
    // Client used to award XP to users on lesson completion.
    RabbitmqModule.register([
      { name: USER_SERVICE.NAME, queueKey: 'rabbitmq.userQueue' },
    ]),
  ],
  controllers: [
    CourseRpcController,
    CategoryRpcController,
    LessonRpcController,
    ModuleRpcController,
    EnrollmentRpcController,
    LessonProgressRpcController,
  ],
  providers: [
    CourseRpcService,
    CategoryRpcService,
    LessonRpcService,
    ModuleRpcService,
    EnrollmentRpcService,
    LessonProgressRpcService,
  ],
})
export class CourseServiceModule {}
