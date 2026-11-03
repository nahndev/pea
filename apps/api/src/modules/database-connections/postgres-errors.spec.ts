import { ErrorCode } from '@tomato/constants';
import { toConnectionErrorCode } from './postgres-errors';

describe('toConnectionErrorCode', () => {
  it.each([
    [{ code: '28P01', message: 'password authentication failed for user "reader"' }, ErrorCode.DATABASE_AUTHENTICATION_FAILED],
    [{ code: '28000', message: 'no pg_hba.conf entry for host "10.0.0.1", SSL off' }, ErrorCode.DATABASE_AUTHENTICATION_FAILED],
    [{ code: '3D000', message: 'database "shop" does not exist' }, ErrorCode.DATABASE_NAME_NOT_FOUND],
    [{ code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND db' }, ErrorCode.DATABASE_HOST_UNREACHABLE],
    [{ code: 'ECONNREFUSED', message: 'connect ECONNREFUSED 127.0.0.1:5432' }, ErrorCode.DATABASE_HOST_UNREACHABLE],
    [{ message: 'timeout expired' }, ErrorCode.DATABASE_CONNECTION_TIMEOUT],
    [{ message: 'The server does not support SSL connections' }, ErrorCode.DATABASE_SSL_FAILED],
    [{ code: 'DEPTH_ZERO_SELF_SIGNED_CERT', message: 'self-signed certificate' }, ErrorCode.DATABASE_SSL_FAILED],
    [{ message: 'boom' }, ErrorCode.DATABASE_CONNECTION_FAILED],
    [undefined, ErrorCode.DATABASE_CONNECTION_FAILED],
  ])('maps %j', (error, expected) => {
    expect(toConnectionErrorCode(error)).toBe(expected);
  });
});
