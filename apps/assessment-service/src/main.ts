import { NestFactory } from '@nestjs/core';
import { AssessmentServiceModule } from './assessment-service.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { RabbitmqService } from '@app/common';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(
    AssessmentServiceModule,
  );
  const configService = appContext.get(ConfigService);

  const rmqOptions = RabbitmqService.getRmqOptions(
    configService,
    'rabbitmq.assessmentQueue',
  );

  await appContext.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AssessmentServiceModule,
    {
      bufferLogs: true,
      ...rmqOptions,
    },
  );

  const logger = app.get(Logger);
  app.useLogger(logger);

  await app.listen();
  logger.log(
    `Assessment service is listening on queue ${configService.get<string>('rabbitmq.assessmentQueue')}`,
  );
}
bootstrap().catch((error: unknown) => {
  console.error('Assessment service failed to start', error);
  process.exitCode = 1;
});
