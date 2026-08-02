import { NestFactory } from '@nestjs/core';
import { CourseServiceModule } from './course-service.module';
import { ConfigService } from '@nestjs/config';
import { RabbitmqService } from '@app/common';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  // Create application context to get configService
  const appContext =
    await NestFactory.createApplicationContext(CourseServiceModule);
  const configService = appContext.get(ConfigService);

  // Get RMQ options
  const rmqOptions = RabbitmqService.getRmqOptions(
    configService,
    'rabbitmq.courseQueue',
  );

  // Close the temporary context to free up memory
  await appContext.close();

  // Create microservice listener using the shared options
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CourseServiceModule,
    {
      bufferLogs: true,
      ...rmqOptions,
    },
  );

  // Set up logging
  const logger = app.get(Logger);
  app.useLogger(logger);

  await app.listen();
  logger.log(
    `Course service is listening on queue ${configService.get<string>('rabbitmq.courseQueue')}`,
  );
}
bootstrap();
