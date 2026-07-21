import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { COURSE_SERVICE } from '@app/contracts/constants/services/course-service.constant';
import { SubjectController } from './subject.controller';
import { GradeLevelController } from './grade-level.controller';
import { FacultyController } from './faculty.controller';
import { MajorController } from './major.controller';
import { ProgrammingCategoryController } from './programming-category.controller';

/**
 * Content structure: subjects + grade levels (K–12), faculties + majors
 * (university), and programming categories (programming). All are served by
 * course-service.
 */
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
    SubjectController,
    GradeLevelController,
    FacultyController,
    MajorController,
    ProgrammingCategoryController,
  ],
})
export class TaxonomyModule {}
