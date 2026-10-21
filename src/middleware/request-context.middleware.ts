import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import {
  HTTP_HEADERS,
  HTTP_HEADER_VALUES,
} from '../common/constants/http.constants.js';

// Give each request a server-owned correlation ID and safe defaults for
// responses that may contain sensitive payment data.
export class RequestContextMiddleware {
  use = (_request: Request, response: Response, next: NextFunction): void => {
    const requestId = randomUUID();

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
