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
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin) || origin.startsWith('capacitor://') || origin.startsWith('file://')) {
        callback(null, true);
      } else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS: ' + origin));
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

  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);

  console.log(`Server running on: http://${host}:${port}`);
  console.log(`Swagger: http://${host}:${port}/api`);
  console.log(`Health: http://${host}:${port}/health`);
}

bootstrap();
