import { NestFactory } from '@nestjs/core';
import { AuthServiceModule } from './auth-service.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { RabbitmqService } from '@app/common';

async function bootstrap() {
  // Create application context to get configService
  const appContext =
    await NestFactory.createApplicationContext(AuthServiceModule);
  const configService = appContext.get(ConfigService);

  // Get RMQ options
  const rmqOptions = RabbitmqService.getRmqOptions(
    configService,
    'rabbitmq.authQueue',
  );

  // Close the temporary context to free up memory
  await appContext.close();

  // Create microservice listener using the shared options
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthServiceModule,
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
    `Auth service is listening on queue ${configService.get<string>('rabbitmq.authQueue')}`,
  );
}
bootstrap().catch((error: unknown) => {
  console.error('Auth service failed to start', error);
  process.exitCode = 1;
});
