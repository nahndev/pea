import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { ErrorCode } from '@tomato/constants';
import { getApiError } from './api-client';

const axiosError = (status: number, data?: unknown) =>
  new AxiosError('failed', 'ERR', undefined, undefined, { status, data } as never);

describe('getApiError', () => {
  it('reads the error body returned by the api', () => {
    expect(getApiError(axiosError(404, { error: { code: ErrorCode.BRANCH_NOT_FOUND } }))).toEqual({
      code: ErrorCode.BRANCH_NOT_FOUND,
    });
  });

  it('falls back to the code of the http status', () => {
    expect(getApiError(axiosError(404)).code).toBe(ErrorCode.NOT_FOUND);
  });

  it('falls back to an internal error for unknown failures', () => {
    expect(getApiError(new Error('boom')).code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
  });
});
