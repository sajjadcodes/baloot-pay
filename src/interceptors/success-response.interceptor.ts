import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { map, Observable } from 'rxjs';
import type { SuccessResponse } from '../common/types/success-response.interface';

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
        if (statusCode === 204 || statusCode === 304) {
          return undefined;
        }

        const requestIdHeader = response.getHeader('X-Request-Id');
        const requestId =
          typeof requestIdHeader === 'string' ? requestIdHeader : null;

        return {
          success: true,
          code: statusCode,
          message: 'Successful request!',
          data,
          requestId,
        };
      }),
    );
  }
}
