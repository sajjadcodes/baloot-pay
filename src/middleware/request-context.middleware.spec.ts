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
    const response = { setHeader } as unknown as Response;
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
    const responseA = { setHeader: setHeaderA } as unknown as Response;
    const responseB = { setHeader: setHeaderB } as unknown as Response;

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
});
