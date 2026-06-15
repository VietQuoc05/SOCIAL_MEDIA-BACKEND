import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = parseInt(process.env.PORT || '3000', 10);

  const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('capacitor://') || origin.startsWith('file://') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(
    '/uploads',
    express.static(join(__dirname, '..', 'uploads')),
  );

  const expressApp = app.getHttpAdapter().getInstance() as import('express').Express;
  expressApp.get('/health', (_req: import('express').Request, res: import('express').Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const config = new DocumentBuilder()
    .setTitle('Social API')
    .setDescription('API for social media backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);

  const displayHost = process.env.CORS_ORIGIN?.split(',')[0]?.replace(/^https?:\/\//, '') || 'localhost';
  console.log(`Server running on: http://${displayHost}:${port}`);
  console.log(`Swagger: http://${displayHost}:${port}/api`);
  console.log(`Health: http://${displayHost}:${port}/health`);
}

bootstrap();
