import type { NextFunction, Request, Response } from 'express';
import { RequestContextMiddleware } from './request-context.middleware';

describe('RequestContextMiddleware', () => {
  it('generates a server-owned request ID and sets API security headers', () => {
    const request = {
      headers: { 'x-request-id': 'caller-controlled' },
    } as unknown as Request;
    const setHeader = jest.fn<void, [name: string, value: string]>();
    const response = { setHeader } as unknown as Response;
    const next = jest.fn() as NextFunction;

    new RequestContextMiddleware().use(request, response, next);

    const requestId = setHeader.mock.calls.find(
      ([name]) => name === 'X-Request-Id',
    )?.[1];

    expect(requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(requestId).not.toBe('caller-controlled');
    expect(setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    expect(setHeader).toHaveBeenCalledWith('Referrer-Policy', 'no-referrer');
    expect(setHeader).toHaveBeenCalledWith(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    );
    expect(setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('generates a distinct request ID for each request', () => {
    const middleware = new RequestContextMiddleware();
    const request = { headers: {} } as unknown as Request;
    const setHeaderA = jest.fn<void, [name: string, value: string]>();
    const setHeaderB = jest.fn<void, [name: string, value: string]>();
    const responseA = { setHeader: setHeaderA } as unknown as Response;
    const responseB = { setHeader: setHeaderB } as unknown as Response;

    middleware.use(request, responseA, jest.fn());
    middleware.use(request, responseB, jest.fn());

    const requestIdA = setHeaderA.mock.calls.find(
      ([name]) => name === 'X-Request-Id',
    )?.[1];
    const requestIdB = setHeaderB.mock.calls.find(
      ([name]) => name === 'X-Request-Id',
    )?.[1];

    expect(requestIdA).not.toBe(requestIdB);
  });
});
