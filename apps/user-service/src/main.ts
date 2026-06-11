import { NestFactory } from '@nestjs/core';
import { UserServiceModule } from './user-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { RabbitmqService } from '@app/common';

async function bootstrap() {
  // Create application context to get configService
  const appContext =
    await NestFactory.createApplicationContext(UserServiceModule);
  const configService = appContext.get(ConfigService);

  // Get RMQ options
  const rmqOptions = RabbitmqService.getRmqOptions(
    configService,
    'rabbitmq.userQueue',
  );

  // Close the temporary context to free up memory
  await appContext.close();

  // Create microservice listener using the shared options
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserServiceModule,
    {
      bufferLogs: true,
      ...rmqOptions,
    },
  );

  // Set up logging
  const logger = app.get(Logger);
  app.useLogger(logger);

  // Start the microservice
  await app.listen();
  logger.log(
    `User service is listening on queue ${configService.get<string>('rabbitmq.userQueue')}`,
  );
}
bootstrap();
