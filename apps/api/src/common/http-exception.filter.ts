import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const details =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const detailObject =
      typeof details === 'object' && details !== null
        ? (details as Record<string, unknown>)
        : {};
    const rawMessage = detailObject.message;
    const message =
      status >= 500
        ? 'Erro interno do servidor'
        : Array.isArray(rawMessage)
          ? 'Dados inválidos'
          : typeof rawMessage === 'string'
            ? rawMessage
            : typeof details === 'string'
              ? details
              : 'Não foi possível concluir a solicitação';
    response.status(status).json({
      statusCode: status,
      code: status === 400 ? 'VALIDATION_ERROR' : `HTTP_${status}`,
      message,
      ...(Array.isArray(rawMessage) ? { errors: rawMessage } : {}),
    });
  }
}
