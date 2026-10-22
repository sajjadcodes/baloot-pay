import { randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import {
  HTTP_HEADERS,
  HTTP_HEADER_VALUES,
} from '../common/constants/http.constants.js';

// Give each request a server-owned correlation ID and safe defaults for
// responses that may contain sensitive payment data.
export class RequestContextMiddleware {
  private readonly logger = new Logger(RequestContextMiddleware.name);

  use = (request: Request, response: Response, next: NextFunction): void => {
    const startTime = process.hrtime.bigint();
    const requestId = randomUUID();

    response.on('finish', () => {
      const routePath = (request.route as { path?: unknown } | undefined)?.path;
      this.logger.log({
        event: 'http.request.completed',
        method: request.method,
        route: typeof routePath === 'string' ? routePath : 'unmatched',
        statusCode: response.statusCode,
        durationMs: Number(process.hrtime.bigint() - startTime) / 1_000_000,
        requestId,
      });
    });

    // Lets clients and operators correlate this request without trusting a caller-supplied ID.
    response.setHeader(HTTP_HEADERS.requestId, requestId);
    // Prevents browsers from interpreting a response as a different MIME type.
    response.setHeader(
      HTTP_HEADERS.contentTypeOptions,
      HTTP_HEADER_VALUES.contentTypeOptions,
    );
    // Prevents this API response from being embedded in a frame.
    response.setHeader(
      HTTP_HEADERS.frameOptions,
      HTTP_HEADER_VALUES.frameOptions,
    );
    // Prevents the browser from sending the API URL as a referrer.
    response.setHeader(
      HTTP_HEADERS.referrerPolicy,
      HTTP_HEADER_VALUES.referrerPolicy,
    );
    // Disables browser features this API does not need.
    response.setHeader(
      HTTP_HEADERS.permissionsPolicy,
      HTTP_HEADER_VALUES.permissionsPolicy,
    );
    // Prevents browsers and intermediary caches from storing potentially sensitive responses.
    response.setHeader(
      HTTP_HEADERS.cacheControl,
      HTTP_HEADER_VALUES.cacheControl,
    );

    next();
  };
}
