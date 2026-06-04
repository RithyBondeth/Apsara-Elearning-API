import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AuthServiceModule } from './auth-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AuthServiceModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL!],
      queue: process.env.AUTH_QUEUE!,
      queueOptions: {
        durable: true,
      },
    },
  });
  await app.listen();
  console.log(`Auth service is listening on queue ${process.env.AUTH_QUEUE}`);
}
bootstrap();
