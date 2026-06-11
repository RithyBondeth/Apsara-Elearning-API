import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Create application context to get configService
  const app = await NestFactory.create<NestExpressApplication>(
    ApiGatewayModule,
    {
      bufferLogs: true,
    },
  );
  const configService = app.get(ConfigService);

  // Swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API GATEWAY')
    .setDescription('KHODE KH PLATFORM API GATEWAY')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      authAction: {
        default: {
          name: 'default',
          schema: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  });

  // Set up logging
  const logger = app.get(Logger);
  app.useLogger(logger);

  // Set global prefix
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Set up validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Start the application
  const port = configService.get<number>('apiGatewayPort') ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on: ${port}`);
}
bootstrap();
