import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ApiErrorResponse } from '../common/types/api-error-response.interface';
import type { SafeApiError } from '../common/types/safe-api-error.type';

const SAFE_ERRORS: Record<number, SafeApiError> = {
  400: { code: 'BAD_REQUEST', message: 'The request is invalid.' },
  401: { code: 'UNAUTHORIZED', message: 'Authentication is required.' },
  403: { code: 'FORBIDDEN', message: 'The operation is not permitted.' },
  404: { code: 'NOT_FOUND', message: 'The requested resource was not found.' },
  409: {
    code: 'CONFLICT',
    message: 'The request conflicts with current state.',
  },
  413: { code: 'PAYLOAD_TOO_LARGE', message: 'The request body is too large.' },
  429: { code: 'RATE_LIMITED', message: 'Too many requests.' },
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    // Use Nest's HTTP response adapter so errors from any route share one format.
    const response = host.switchToHttp().getResponse<Response>();

    // Preserve expected HTTP statuses; treat unrecognized exceptions as server errors.
    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : 500;

    // Return only approved public messages, never exception/provider details.
    const safeError = SAFE_ERRORS[statusCode] ?? {
      code: statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED',
      message:
        statusCode >= 500
          ? 'An unexpected error occurred.'
          : 'The request could not be completed.',
    };

    // Attach the middleware-generated ID so clients can report the matching server log.
    const requestIdHeader = response.getHeader('X-Request-Id');
    const requestId =
      typeof requestIdHeader === 'string' ? requestIdHeader : null;

    // Log unexpected failures for operators without returning internal details to callers.
    if (statusCode >= 500) {
      const errorType =
        exception instanceof Error ? exception.name : typeof exception;
      this.logger.error(
        `Request failed with ${errorType}; requestId=${requestId ?? 'unavailable'}`,
      );
    }

    // Keep the response shape stable for client handling and API documentation.
    const body: ApiErrorResponse = {
      statusCode,
      ...safeError,
      requestId,
    };

    // Send the sanitized body using the original HTTP status.
    response.status(statusCode).json(body);
  }
}
