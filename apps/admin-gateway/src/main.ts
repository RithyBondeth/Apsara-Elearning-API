import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { AdminGatewayModule } from './admin-gateway.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { RpcToHttpExceptionFilter, setupSwagger } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AdminGatewayModule,
    { bufferLogs: true },
  );

  const configService = app.get(ConfigService);
  const logger = app.get(Logger);

  // Swagger configuration
  setupSwagger(app, {
    title: 'ADMIN GATEWAY',
    description: 'KHODE KH PLATFORM ADMIN GATEWAY',
    path: 'admin/docs',
  });

  app.useLogger(logger);
  app.setGlobalPrefix('admin');

  // CORS — restrict via CORS_ORIGINS (comma-separated); '*' if unset.
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
  app.enableCors({ origin, credentials: origin !== '*' });

  app.useGlobalPipes(
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
