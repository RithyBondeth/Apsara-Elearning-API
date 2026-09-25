import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { COURSE_SERVICE } from '@app/contracts/constants/services/course-service.constant';
import { CourseController } from './controllers/course.controller';
import { ModuleController } from './controllers/module.controller';
import { LessonController } from './controllers/lesson.controller';
import { ReviewController } from './controllers/review.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: COURSE_SERVICE.NAME,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('rabbitmq.url')!],
            queue: configService.get<string>('rabbitmq.courseQueue')!,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [
    CourseController,
    ModuleController,
    LessonController,
    ReviewController,
  ],
})
export class CourseModule {}
