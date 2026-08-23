import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import express from 'express';
import dns from 'dns';
import { ENV } from './config/env.config';
// import { Express } from 'express';

dns.setServers(['1.1.1.1', '8.8.8.8']);

const server = express();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  app.use(express.json({ limit: '10mb' }));
  app.use(
    express.urlencoded({
      extended: true,
      limit: '10mb',
    }),
  );

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: ENV.FRONTEND_ORIGIN,
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

  await app.init();

  if (process.env.NODE_ENV !== 'production') {
    const port = ENV.PORT ?? 3000;
    await app.listen(port);
    console.log(`Server is running on port: ${port}`);
  }
}

bootstrap();

export default server;
