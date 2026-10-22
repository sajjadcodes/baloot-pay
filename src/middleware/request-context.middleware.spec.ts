import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { jest } from '@jest/globals';
import {
  HTTP_HEADERS,
  HTTP_HEADER_VALUES,
} from '../common/constants/http.constants.js';
import { UUID_V4_PATTERN } from '../common/constants/regex.constants.js';
import { RequestContextMiddleware } from './request-context.middleware.js';

describe('RequestContextMiddleware', () => {
  it('generates a server-owned request ID and sets API security headers', () => {
    const request = {
      headers: {
        [HTTP_HEADERS.requestId.toLowerCase()]: 'caller-controlled',
      },
    } as unknown as Request;
    const setHeader = jest.fn<(name: string, value: string) => void>();
    const response = {
      setHeader,
      on: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    new RequestContextMiddleware().use(request, response, next);

    const requestId = setHeader.mock.calls.find(
      ([name]) => name === HTTP_HEADERS.requestId,
    )?.[1];

    expect(requestId).toMatch(UUID_V4_PATTERN);
    expect(requestId).not.toBe('caller-controlled');
    expect(setHeader).toHaveBeenCalledWith(
      HTTP_HEADERS.contentTypeOptions,
      HTTP_HEADER_VALUES.contentTypeOptions,
    );
    expect(setHeader).toHaveBeenCalledWith(
      HTTP_HEADERS.frameOptions,
      HTTP_HEADER_VALUES.frameOptions,
    );
    expect(setHeader).toHaveBeenCalledWith(
      HTTP_HEADERS.referrerPolicy,
      HTTP_HEADER_VALUES.referrerPolicy,
    );
    expect(setHeader).toHaveBeenCalledWith(
      HTTP_HEADERS.permissionsPolicy,
      HTTP_HEADER_VALUES.permissionsPolicy,
    );
    expect(setHeader).toHaveBeenCalledWith(
      HTTP_HEADERS.cacheControl,
      HTTP_HEADER_VALUES.cacheControl,
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('generates a distinct request ID for each request', () => {
    const middleware = new RequestContextMiddleware();
    const request = { headers: {} } as unknown as Request;
    const setHeaderA = jest.fn<(name: string, value: string) => void>();
    const setHeaderB = jest.fn<(name: string, value: string) => void>();
    const responseA = {
      setHeader: setHeaderA,
      on: jest.fn(),
    } as unknown as Response;
    const responseB = {
      setHeader: setHeaderB,
      on: jest.fn(),
    } as unknown as Response;

    middleware.use(request, responseA, jest.fn());
    middleware.use(request, responseB, jest.fn());

    const requestIdA = setHeaderA.mock.calls.find(
      ([name]) => name === HTTP_HEADERS.requestId,
    )?.[1];
    const requestIdB = setHeaderB.mock.calls.find(
      ([name]) => name === HTTP_HEADERS.requestId,
    )?.[1];

    expect(requestIdA).not.toBe(requestIdB);
  });

  it('logs completed requests as structured metadata without request secrets', () => {
    const loggerLog = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    let onFinish: (() => void) | undefined;
    const setHeader = jest.fn<(name: string, value: string) => void>();
    const response = {
      setHeader,
      getHeader: jest.fn().mockReturnValue('request-456'),
      on: jest.fn((_event: string, listener: () => void) => {
        onFinish = listener;
      }),
      statusCode: 200,
    } as unknown as Response;
    const request = {
      method: 'GET',
      route: { path: '/api/payments/:id' },
      originalUrl: '/api/payments/123?token=secret',
      headers: { authorization: 'Bearer secret' },
      body: { cardNumber: '4111111111111111' },
    } as unknown as Request;

    try {
      new RequestContextMiddleware().use(request, response, jest.fn());
      onFinish?.();
      const requestId = setHeader.mock.calls.find(
        ([name]) => name === HTTP_HEADERS.requestId,
      )?.[1];

      expect(loggerLog).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'http.request.completed',
          method: 'GET',
          route: '/api/payments/:id',
          statusCode: 200,
          requestId,
        }),
      );
      expect(JSON.stringify(loggerLog.mock.calls)).not.toContain('secret');
      expect(JSON.stringify(loggerLog.mock.calls)).not.toContain(
        '4111111111111111',
      );
    } finally {
      loggerLog.mockRestore();
    }
  });
});
