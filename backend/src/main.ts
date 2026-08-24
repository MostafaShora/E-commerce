import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import express from 'express';
import dns from 'dns';
import { ENV } from './config/env.config';

dns.setServers(['1.1.1.1', '8.8.8.8']);

const server = express();

let appInitialized = false;

async function bootstrap() {
  if (appInitialized) {
    return;
  }

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(server),
    {
      rawBody: true,
    },
  );

  // Let Nest manage JSON/urlencoded parsing.
  // This also preserves req.rawBody because rawBody: true is enabled.
  app.useBodyParser('json', {
    limit: '10mb',
  });

  app.useBodyParser('urlencoded', {
    limit: '10mb',
    extended: true,
  });

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

  appInitialized = true;

  console.log('Nest application initialized successfully');
}

const handler = async (req: express.Request, res: express.Response) => {
  await bootstrap();

  server(req, res);
};

if (process.env.NODE_ENV !== 'production') {
  bootstrap().then(() => {
    const port = ENV.PORT ?? 3000;

    server.listen(port, () => {
      console.log(`Server is running on port: ${port}`);
    });
  });
}

export default handler;
