import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    ApiGatewayModule,
    {
      bufferLogs: true,
    },
  );
  const configService = app.get(ConfigService);
  const logger = app.get(Logger);

  app.useLogger(logger);
  app.setGlobalPrefix('api');
  app.enableCors();

  const port = configService.get<number>('apiGatewayPort') ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on: ${port}`);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
