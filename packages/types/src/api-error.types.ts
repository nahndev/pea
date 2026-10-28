import type { ErrorCode } from '@tomato/constants';

export type ApiErrorDetails = Record<string, string[]>;

export interface ApiError {
  code: ErrorCode;
  details?: ApiErrorDetails;
}

export interface ApiErrorResponse {
  error: ApiError;
}
