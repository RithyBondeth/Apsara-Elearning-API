import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { AdminGatewayModule } from './admin-gateway.module';
import { ValidationPipe } from '@nestjs/common';
import {
  resolveCorsOrigin,
  RpcToHttpExceptionFilter,
  setupSwagger,
  UuidParamPipe,
} from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AdminGatewayModule,
    { bufferLogs: true },
  );

  const configService = app.get(ConfigService);
  const logger = app.get(Logger);

  app.useLogger(logger);
  app.setGlobalPrefix('admin');

  // Swagger configuration — must be after setGlobalPrefix so paths are correct
  setupSwagger(app, {
    title: 'ADMIN GATEWAY',
    description: 'KHODE KH PLATFORM ADMIN GATEWAY',
    path: 'admin/docs',
  });

  // CORS — restrict via CORS_ORIGINS (comma-separated). Required in
  // production; falls back to '*' for local development only.
  const origin = resolveCorsOrigin(configService);
  if (origin === '*') {
    logger.warn('CORS is open to all origins — set CORS_ORIGINS to restrict.');
  }
  app.enableCors({ origin, credentials: origin !== '*' });

  app.useGlobalPipes(
    new UuidParamPipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new RpcToHttpExceptionFilter());

  const port = configService.get<number>('adminGatewayPort') ?? 2222;
  await app.listen(port);
  logger.log(`Admin gateway is running on: ${port}`);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
