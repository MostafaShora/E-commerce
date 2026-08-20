import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import express from 'express';
import dns from 'dns';

dns.setServers(['1.1.1.1', '8.8.8.8']);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(express.json({ limit: '10mb' }));

  app.use(
    express.urlencoded({
      extended: true,
      limit: '10mb',
    }),
  );

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  console.log('Server is running on port:', process.env.PORT ?? 3000);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
