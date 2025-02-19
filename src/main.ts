import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  const options = new DocumentBuilder()
    .setTitle('nest-music-app')
    .setDescription(
      'A NestJS-powered back-end with authentication, PostgreSQL, Prisma, and Redis. Built to showcase scalable API design and back-end architecture.',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('swag', app, document); // open browser thisAppDomain/swag e.g. localhost:3000/swag
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
