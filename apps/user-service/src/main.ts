import { NestFactory } from '@nestjs/core';
import { UserServiceModule } from './user-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const appContext =
    await NestFactory.createApplicationContext(UserServiceModule);
  const configService = appContext.get(ConfigService);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserServiceModule,
    {
      bufferLogs: true,
      transport: Transport.RMQ,
      options: {
        urls: [configService.get<string>('rabbitmq.url')!],
        queue: configService.get<string>('rabbitmq.userQueue')!,
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
    `User service is listening on queue ${configService.get<string>('rabbitmq.userQueue')}`,
  );
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
