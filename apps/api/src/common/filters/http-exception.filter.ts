import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ErrorCode, HttpStatusErrorCode } from '@tomato/constants';
import type { ApiError, ApiErrorResponse } from '@tomato/types';
import type { Response } from 'express';

const ERROR_CODES = new Set<string>(Object.values(ErrorCode));

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) this.logger.error(exception);

    const body: ApiErrorResponse = { error: this.toApiError(exception, status) };
    response.status(status).json(body);
  }

  private toApiError(exception: unknown, status: number): ApiError {
    const fallback = HttpStatusErrorCode[status] ?? ErrorCode.INTERNAL_SERVER_ERROR;
    if (!(exception instanceof HttpException)) return { code: ErrorCode.INTERNAL_SERVER_ERROR };

    const payload = exception.getResponse();
    if (typeof payload !== 'object' || payload === null) return { code: fallback };

    const { code, details } = payload as { code?: unknown; details?: ApiError['details'] };
    return {
      code: typeof code === 'string' && ERROR_CODES.has(code) ? (code as ErrorCode) : fallback,
      ...(details && { details }),
    };
  }
}
