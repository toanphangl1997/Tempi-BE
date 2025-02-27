import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as swaggerUi from 'swagger-ui-express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());

  // Xây dựng swagger
  const config = new DocumentBuilder()
    .setTitle('Phone_API')
    .setDescription('Document API db_phone')
    .setVersion('1.0')
    .addBearerAuth() // Thêm Bearer Auth cho Swagger
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Tùy chỉnh màu nền của Swagger
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(document, {
      customCss: `
        body {
          background-color: #f0f0f0; /* Màu nền tùy chỉnh */
        }
        .swagger-ui {
          background-color: #fff !important; /* Nền của Swagger */
        }
      `,
    }),
  );

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
