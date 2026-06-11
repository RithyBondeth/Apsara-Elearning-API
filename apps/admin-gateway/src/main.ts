import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { AdminGatewayModule } from './admin-gateway.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AdminGatewayModule,
    { bufferLogs: true },
  );

  const configService = app.get(ConfigService);
  const logger = app.get(Logger);

  // Swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ADMIN GATEWAY')
    .setDescription('KHODE KH PLATFORM ADMIN GATEWAY')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('admin/docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.useLogger(logger);
  app.setGlobalPrefix('admin');
  app.enableCors();

  const port = configService.get<number>('adminGatewayPort') ?? 2222;
  await app.listen(port);
  logger.log(`Admin gateway is running on: ${port}`);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
