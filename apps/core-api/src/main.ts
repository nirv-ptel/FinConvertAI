import { NestApplication, NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Logger } from '@nestjs/common';
import swaggerInit from './swagger';
import * as express from 'express';
import { LoggerErrorInterceptor, Logger as PinoLogger } from 'nestjs-pino';
import { ENUM_APP_ENVIROMENT } from './app/constants/app.enum.constant';

async function bootstrap() {
  const app: NestApplication = await NestFactory.create(AppModule, {
    logger: console,
  });

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization,x-tenant-id,X-TENANT-ID',
    credentials: true,
  });
  app.useBodyParser('json', { limit: '100mb' });
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Swagger Init
  await swaggerInit(app);
  // Pino Logger
  if (process.env.APP_ENV.trim() !== ENUM_APP_ENVIROMENT.DEVELOPMENT) {
    setTimeout(() => {
      app.useLogger(app.get(PinoLogger));
      //app.flushLogs();
      app.useGlobalInterceptors(new LoggerErrorInterceptor());
    }, 5000);
  }

  await app.listen(process.env.HTTP_PORT, process.env.HTTP_HOST);
  const logger = new Logger();
  logger.log(`==========================================================`);
  logger.log(`Http Server running on ${await app.getUrl()}`, 'NestApplication');
  logger.log(`==========================================================`);
}
bootstrap();
