import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

// Give each request a server-owned correlation ID and safe defaults for
// responses that may contain sensitive payment data.
export class RequestContextMiddleware {
  use = (_request: Request, response: Response, next: NextFunction): void => {
    const requestId = randomUUID();

    // Lets clients and operators correlate this request without trusting a caller-supplied ID.
    response.setHeader('X-Request-Id', requestId);
    // Prevents browsers from interpreting a response as a different MIME type.
    response.setHeader('X-Content-Type-Options', 'nosniff');
    // Prevents this API response from being embedded in a frame.
    response.setHeader('X-Frame-Options', 'DENY');
    // Prevents the browser from sending the API URL as a referrer.
    response.setHeader('Referrer-Policy', 'no-referrer');
    // Disables browser features this API does not need.
    response.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    );
    // Prevents browsers and intermediary caches from storing potentially sensitive responses.
    response.setHeader('Cache-Control', 'no-store');

    next();
  };
}
