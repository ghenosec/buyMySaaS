import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(new Logger());
  app.setGlobalPrefix('api/v1');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser());
  const requestLogger = new Logger('HTTP');
  app.use((request: Request, response: Response, next: NextFunction) => {
    const requestId = request.get('x-request-id') ?? randomUUID();
    const startedAt = Date.now();
    response.setHeader('x-request-id', requestId);
    response.on('finish', () =>
      requestLogger.log(
        JSON.stringify({
          requestId,
          method: request.method,
          path: request.originalUrl,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
        }),
      ),
    );
    next();
  });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors({
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  });
  app.useStaticAssets(
    join(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads'),
    { prefix: '/uploads/' },
  );

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Buy My SaaS API')
      .setVersion('1.0')
      .addCookieAuth('bms_session')
      .build(),
  );
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  Logger.log(`API disponível em http://localhost:${port}/api/v1`, 'Bootstrap');
}

void bootstrap();
