import { NestFactory } from '@nestjs/core';
import { AiServiceModule } from './ai-service.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import {
  RabbitmqService,
  initErrorTracking,
  ReportingRpcExceptionFilter,
} from '@app/common';

async function bootstrap() {
  // First, so failures during startup are reported too.
  initErrorTracking('ai-service');

  const appContext =
    await NestFactory.createApplicationContext(AiServiceModule);
  const configService = appContext.get(ConfigService);

  const rmqOptions = RabbitmqService.getRmqOptions(
    configService,
    'rabbitmq.aiQueue',
  );

  await appContext.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AiServiceModule,
    {
      bufferLogs: true,
      ...rmqOptions,
    },
  );

  // Report unexpected handler errors (not deliberate RpcExceptions).
  app.useGlobalFilters(new ReportingRpcExceptionFilter());

  const logger = app.get(Logger);
  app.useLogger(logger);

  await app.listen();
  logger.log(
    `AI service is listening on queue ${configService.get<string>('rabbitmq.aiQueue')}`,
  );
}
bootstrap().catch((error: unknown) => {
  console.error('AI service failed to start', error);
  process.exitCode = 1;
});
