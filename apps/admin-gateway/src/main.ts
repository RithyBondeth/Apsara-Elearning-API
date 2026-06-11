import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { AdminGatewayModule } from './admin-gateway.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AdminGatewayModule,
    { bufferLogs: true },
  );

  const configService = app.get(ConfigService);
  const logger = app.get(Logger);

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
