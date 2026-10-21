export interface SuccessResponse<T> {
  success: true;
  code: number;
  message: string;
  data: T;
  requestId: string | null;
}
