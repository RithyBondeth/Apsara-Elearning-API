import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AuthServiceModule } from './auth-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const appContext =
    await NestFactory.createApplicationContext(AuthServiceModule);
  const configService = appContext.get<ConfigService>(ConfigService);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthServiceModule,
    {
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
  await app.listen();
  console.log(
    `Auth service is listening on queue ${configService.get<string>('rabbitmq.authQueue')}`,
  );
}
bootstrap();
