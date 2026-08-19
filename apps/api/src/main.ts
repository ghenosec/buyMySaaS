import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { getUploadRoot } from './modules/storage/image-file';

const stateChangingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

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
  const webOrigin = new URL(process.env.WEB_URL ?? 'http://localhost:3000')
    .origin;
  app.use((request: Request, response: Response, next: NextFunction) => {
    if (!stateChangingMethods.has(request.method)) return next();
    const origin = request.get('origin');
    const referer = request.get('referer');
    const requestOrigin = origin ?? (referer ? safeOrigin(referer) : undefined);
    if (requestOrigin && requestOrigin !== webOrigin) {
      response.status(403).json({
        statusCode: 403,
        code: 'CSRF_ORIGIN_DENIED',
        message: 'Origem da requisição não permitida',
      });
      return;
    }
    next();
  });
  app.useStaticAssets(getUploadRoot(), {
    prefix: '/uploads/',
    dotfiles: 'deny',
    index: false,
    setHeaders: (response: Response) => {
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.setHeader(
        'Cache-Control',
        'public, max-age=31536000, immutable',
      );
    },
  });

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

function safeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}
