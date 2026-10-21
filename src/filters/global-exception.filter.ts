import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  INTERNAL_ERROR,
  REQUEST_FAILED_ERROR,
  SAFE_API_ERRORS,
} from '../common/constants/api-error.constants.js';
import {
  HTTP_HEADERS,
  HTTP_STATUS,
} from '../common/constants/http.constants.js';
import type { ApiErrorResponse } from '../common/types/api-error-response.interface.js';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    // Use Nest's HTTP response adapter so errors from any route share one format.
    const response = host.switchToHttp().getResponse<Response>();

    // Preserve expected HTTP statuses; treat unrecognized exceptions as server errors.
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HTTP_STATUS.internalServerError;

    // Return only approved public messages, never exception/provider details.
    const safeError =
      SAFE_API_ERRORS[statusCode] ??
      (statusCode >= HTTP_STATUS.internalServerError
        ? INTERNAL_ERROR
        : REQUEST_FAILED_ERROR);

    // Attach the middleware-generated ID so clients can report the matching server log.
    const requestIdHeader = response.getHeader(HTTP_HEADERS.requestId);
    const requestId =
      typeof requestIdHeader === 'string' ? requestIdHeader : null;

    // Log unexpected failures for operators without returning internal details to callers.
    if (statusCode >= HTTP_STATUS.internalServerError) {
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
