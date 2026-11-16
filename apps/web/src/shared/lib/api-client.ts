import axios, { isAxiosError } from 'axios';
import { ErrorCode, HttpStatusErrorCode } from '@tomato/constants';
import type { ApiError, ApiErrorResponse } from '@tomato/types';
import { LOGIN_PATH, loginHref } from './login';

const UNAUTHORIZED_STATUS = 401;

export const apiClient = axios.create({ baseURL: '/rest' });

/** An expired session sends the user to the login page, back here once signed in */
apiClient.interceptors.response.use(undefined, (error: unknown) => {
  const { pathname, search } = window.location;
  if (isAxiosError(error) && error.response?.status === UNAUTHORIZED_STATUS && pathname !== LOGIN_PATH) {
    window.location.assign(loginHref(pathname + search));
  }
  return Promise.reject(error);
});

export function getApiError(error: unknown): ApiError {
  if (isAxiosError<ApiErrorResponse>(error)) {
    const status = error.response?.status;
    return error.response?.data?.error ?? { code: (status && HttpStatusErrorCode[status]) || ErrorCode.INTERNAL_SERVER_ERROR };
  }
  return { code: ErrorCode.INTERNAL_SERVER_ERROR };
}
