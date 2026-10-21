import { CallHandler, ExecutionContext } from '@nestjs/common';
import type { Response } from 'express';
import { of } from 'rxjs';
import { HTTP_STATUS } from '../common/constants/http.constants';
import { SUCCESS_RESPONSE_MESSAGE } from '../common/constants/application.constants';
import type { SuccessResponse } from '../common/types/success-response.interface';
import { SuccessResponseInterceptor } from './success-response.interceptor';

describe('SuccessResponseInterceptor', () => {
  function createContext(response: Partial<Response>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getResponse: () => response,
      }),
    } as ExecutionContext;
  }

  function createHandler(value: unknown): CallHandler {
    return { handle: () => of(value) };
  }

  it('wraps success data with the actual HTTP status and request ID', (done) => {
    const response = {
      statusCode: HTTP_STATUS.accepted,
      getHeader: jest.fn().mockReturnValue('request-123'),
    } as unknown as Response;
    const interceptor = new SuccessResponseInterceptor<{
      paymentId: string;
    }>();

    interceptor
      .intercept(
        createContext(response),
        createHandler({ paymentId: 'payment-1' }),
      )
      .subscribe({
        next: (result) => {
          expect(result).toEqual({
            success: true,
            code: HTTP_STATUS.accepted,
            message: SUCCESS_RESPONSE_MESSAGE,
            data: { paymentId: 'payment-1' },
            requestId: 'request-123',
          });
          done();
        },
        error: done,
      });
  });

  it.each([HTTP_STATUS.noContent, HTTP_STATUS.notModified])(
    'does not create a response body for HTTP %s',
    (statusCode) => {
      const response = {
        statusCode,
        getHeader: jest.fn(),
      } as unknown as Response;
      const interceptor = new SuccessResponseInterceptor<string>();
      let result: SuccessResponse<string> | undefined;
      let emissions = 0;

      interceptor
        .intercept(createContext(response), createHandler('no-content'))
        .subscribe((value) => {
          result = value;
          emissions += 1;
        });

      expect(emissions).toBe(1);
      expect(result).toBeUndefined();
    },
  );
});
