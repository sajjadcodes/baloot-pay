import type { SafeApiError } from '../types/safe-api-error.type';

export const SAFE_API_ERRORS: Record<number, SafeApiError> = {
  400: { code: 'BAD_REQUEST', message: 'The request is invalid.' },
  401: { code: 'UNAUTHORIZED', message: 'Authentication is required.' },
  403: { code: 'FORBIDDEN', message: 'The operation is not permitted.' },
  404: { code: 'NOT_FOUND', message: 'The requested resource was not found.' },
  409: {
    code: 'CONFLICT',
    message: 'The request conflicts with current state.',
  },
  413: { code: 'PAYLOAD_TOO_LARGE', message: 'The request body is too large.' },
  429: { code: 'RATE_LIMITED', message: 'Too many requests.' },
};

export const INTERNAL_ERROR: SafeApiError = {
  code: 'INTERNAL_ERROR',
  message: 'An unexpected error occurred.',
};

export const REQUEST_FAILED_ERROR: SafeApiError = {
  code: 'REQUEST_FAILED',
  message: 'The request could not be completed.',
};
