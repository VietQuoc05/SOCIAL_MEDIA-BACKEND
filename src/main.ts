import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ============================
  // ✅ ENABLE CORS
  // ============================
  app.enableCors();

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
  // ✅ SERVE STATIC FILE (UPLOADS) 🔥
  // ============================
  app.use(
    '/uploads',
    express.static(join(__dirname, '..', 'uploads')),
  );

  // ============================
  // ✅ SWAGGER
  // ============================
  const config = new DocumentBuilder()
    .setTitle('Social API')
    .setDescription('API for social media backend')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // ============================
  // ✅ START SERVER
  // ============================
  await app.listen(3000);

  console.log(`✅ Server running on: http://localhost:3000`);
  console.log(`✅ Swagger: http://localhost:3000/api`);
}

bootstrap();
