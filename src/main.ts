import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ enable CORS
  app.enableCors();

  // ✅ SWAGGER CONFIG
  const config = new DocumentBuilder()
    .setTitle('Social API')
    .setDescription('API for social media backend')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token', // 👈 key name
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  // ✅ RUN APP
  await app.listen(3000);

  console.log(`✅ Server running on: http://localhost:3000`);
  console.log(`✅ Swagger available at: http://localhost:3000/api`);
}

bootstrap();
``