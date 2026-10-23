import { NestFactory } from '@nestjs/core';
import { SubscriptionServiceModule } from './subscription-service.module';
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
  initErrorTracking('subscription-service');

  const appContext = await NestFactory.createApplicationContext(
    SubscriptionServiceModule,
  );
  const configService = appContext.get(ConfigService);

  const rmqOptions = RabbitmqService.getRmqOptions(
    configService,
    'rabbitmq.subscriptionQueue',
  );

  await appContext.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    SubscriptionServiceModule,
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
    `Subscription service is listening on queue ${configService.get<string>('rabbitmq.subscriptionQueue')}`,
  );
}
void bootstrap();
