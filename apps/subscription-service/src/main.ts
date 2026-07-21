import { NestFactory } from '@nestjs/core';
import { SubscriptionServiceModule } from './subscription-service.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { RabbitmqService } from '@app/common';

async function bootstrap() {
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

  const logger = app.get(Logger);
  app.useLogger(logger);

  await app.listen();
  logger.log(
    `Subscription service is listening on queue ${configService.get<string>('rabbitmq.subscriptionQueue')}`,
  );
}
bootstrap();
