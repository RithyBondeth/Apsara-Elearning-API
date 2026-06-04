import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(ApiGatewayModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  await app.listen(process.env.API_GATEWAY_PORT ?? 3000);
  console.log(`Application is running on: ${process.env.API_GATEWAY_PORT}`);
}
bootstrap();
