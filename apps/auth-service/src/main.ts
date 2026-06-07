import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AuthServiceModule } from './auth-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const appContext =
    await NestFactory.createApplicationContext(AuthServiceModule);
  const configService = appContext.get(ConfigService);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthServiceModule,
    {
      bufferLogs: true,
      transport: Transport.RMQ,
      options: {
        urls: [configService.get<string>('rabbitmq.url')!],
        queue: configService.get<string>('rabbitmq.authQueue')!,
        queueOptions: {
          durable: true,
        },
      },
    },
  );

  const logger = app.get(Logger);
  app.useLogger(logger);

  await app.listen();
  logger.log(
    `Auth service is listening on queue ${configService.get<string>('rabbitmq.authQueue')}`,
  );
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
