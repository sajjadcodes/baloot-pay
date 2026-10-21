import { CallHandler, ExecutionContext } from '@nestjs/common';
import type { Response } from 'express';
import { of } from 'rxjs';
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
      statusCode: 202,
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
            code: 202,
            message: 'Successful request!',
            data: { paymentId: 'payment-1' },
            requestId: 'request-123',
          });
          done();
        },
        error: done,
      });
  });

  it.each([204, 304])(
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
