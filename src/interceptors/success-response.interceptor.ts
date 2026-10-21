import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { map, Observable } from 'rxjs';
import { SUCCESS_RESPONSE_MESSAGE } from '../common/constants/application.constants.js';
import {
  HTTP_HEADERS,
  HTTP_STATUS,
} from '../common/constants/http.constants.js';
import type { SuccessResponse } from '../common/types/success-response.interface.js';

@Injectable()
export class SuccessResponseInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponse<T> | undefined
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T> | undefined> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data: T) => {
        const statusCode = response.statusCode;

        // HTTP forbids response bodies for these statuses; preserve that contract.
        if (
          statusCode === HTTP_STATUS.noContent ||
          statusCode === HTTP_STATUS.notModified
        ) {
          return undefined;
        }

        const requestIdHeader = response.getHeader(HTTP_HEADERS.requestId);
        const requestId =
          typeof requestIdHeader === 'string' ? requestIdHeader : null;

        return {
          success: true,
          code: statusCode,
          message: SUCCESS_RESPONSE_MESSAGE,
          data,
          requestId,
        };
      }),
    );
  }
}
