import type { ApiErrorResponse } from './api-error-response.interface';

export type SafeApiError = Pick<ApiErrorResponse, 'code' | 'message'>;
