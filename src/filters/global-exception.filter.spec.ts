import { ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let response: Pick<Response, 'getHeader' | 'status' | 'json'>;
  let status: jest.Mock;
  let json: jest.Mock;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    json = jest.fn();
    status = jest.fn().mockReturnThis();
    response = {
      getHeader: jest.fn().mockReturnValue('request-123'),
      status,
      json,
    };
  });

  function createHost(): ArgumentsHost {
    return {
      switchToHttp: () => ({
        getResponse: () => response,
      }),
    } as ArgumentsHost;
  }

  it('maps HTTP exceptions to a stable response and includes the request ID', () => {
    filter.catch(
      new HttpException('provider detail must not be exposed', 409),
      createHost(),
    );

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      statusCode: 409,
      code: 'CONFLICT',
      message: 'The request conflicts with current state.',
      requestId: 'request-123',
    });
  });

  it('does not expose unexpected exception details and logs the error type', () => {
    const loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation();

    try {
      filter.catch(new Error('sensitive provider response'), createHost());

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
        requestId: 'request-123',
      });
      expect(loggerError).toHaveBeenCalledWith(
        'Request failed with Error; requestId=request-123',
      );
      expect(JSON.stringify(json.mock.calls[0])).not.toContain(
        'sensitive provider response',
      );
    } finally {
      loggerError.mockRestore();
    }
  });

  it('returns a null request ID if request context was not initialized', () => {
    jest.spyOn(response, 'getHeader').mockReturnValue(undefined);

    filter.catch(new HttpException('not found', 404), createHost());

    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.',
      requestId: null,
    });
  });
});
