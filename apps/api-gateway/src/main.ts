import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { RpcToHttpExceptionFilter, setupSwagger } from '@app/common';

async function bootstrap() {
  // Create application context to get configService
  const app = await NestFactory.create<NestExpressApplication>(
    ApiGatewayModule,
    {
      bufferLogs: true,
    },
  );
  const configService = app.get(ConfigService);

  // Set up logging
  const logger = app.get(Logger);
  app.useLogger(logger);

  // Set global prefix
  app.setGlobalPrefix('api/v1/internal');

  // Swagger configuration — must be after setGlobalPrefix so paths are correct
  setupSwagger(app, {
    title: 'API GATEWAY',
    description: 'KHODE KH PLATFORM API GATEWAY',
    path: 'api/v1/internal/docs',
  });

  // Enable CORS — restrict via CORS_ORIGINS (comma-separated); '*' if unset.
  const corsOrigins = configService.get<string>('cors.origins');
  const origin = corsOrigins
    ? corsOrigins
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : '*';
  if (origin === '*') {
    logger.warn('CORS is open to all origins — set CORS_ORIGINS to restrict.');
  }
  app.enableCors({
    origin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: origin !== '*',
  });

  // Set up validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Map microservice (RPC) errors to proper HTTP responses
  app.useGlobalFilters(new RpcToHttpExceptionFilter());

  // Start the application
  const port = configService.get<number>('apiGatewayPort') ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on: ${port}`);
}
bootstrap();
