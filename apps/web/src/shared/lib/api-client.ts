import axios, { isAxiosError } from 'axios';
import { ErrorCode, HttpStatusErrorCode } from '@tomato/constants';
import type { ApiError, ApiErrorResponse } from '@tomato/types';

export const apiClient = axios.create({ baseURL: '/rest' });

export function getApiError(error: unknown): ApiError {
  if (isAxiosError<ApiErrorResponse>(error)) {
    const status = error.response?.status;
    return error.response?.data?.error ?? { code: (status && HttpStatusErrorCode[status]) || ErrorCode.INTERNAL_SERVER_ERROR };
  }
  return { code: ErrorCode.INTERNAL_SERVER_ERROR };
}
