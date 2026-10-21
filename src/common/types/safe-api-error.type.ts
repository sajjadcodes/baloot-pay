import type { ApiErrorResponse } from './api-error-response.interface.js';

export type SafeApiError = Pick<ApiErrorResponse, 'code' | 'message'>;
