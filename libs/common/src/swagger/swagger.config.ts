import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export interface SwaggerConfigOptions {
  title: string;
  description: string;
  version?: string;
  path: string;
  basePath?: string;
}

export function setupSwagger(
  app: INestApplication,
  options: SwaggerConfigOptions,
) {
  const config = new DocumentBuilder()
    .setTitle(options.title)
    .setDescription(options.description)
    .setVersion(options.version || '1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  SwaggerModule.setup(options.path, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
