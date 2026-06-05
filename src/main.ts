import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ============================
  // ✅ ENABLE CORS (FIX SWAGGER)
  // ============================
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // ============================
  // ✅ VALIDATION PIPE
  // ============================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ============================
  // ✅ SERVE STATIC FILE
  // ============================
  app.use(
    '/uploads',
    express.static(join(__dirname, '..', 'uploads')),
  );

  // ============================
  // ✅ SWAGGER ✅ FIX QUAN TRỌNG
  // ============================
  const config = new DocumentBuilder()
    .setTitle('Social API')
    .setDescription('API for social media backend')
    .setVersion('1.0')
    .addBearerAuth() // ✅ đơn giản + đúng chuẩn
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // ✅ giữ token sau refresh
    },
  });

  // ============================
  // ✅ START SERVER
  // ============================
  await app.listen(3000);

  console.log(`✅ Server running on: http://localhost:3000`);
  console.log(`✅ Swagger: http://localhost:3000/api`);
}

bootstrap();
``