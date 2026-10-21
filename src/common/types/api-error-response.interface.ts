export interface ApiErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  requestId: string | null;
}
