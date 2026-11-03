import { ErrorCode } from '@tomato/constants';
import { CONNECTION_ERROR_CODE_BY_CAUSE } from './database-connections.constants';

/** Error code of a failed `client.connect()` */
export function toConnectionErrorCode(error: unknown): ErrorCode {
  const { code = '', message = '' } = (error ?? {}) as { code?: string; message?: string };
  if (CONNECTION_ERROR_CODE_BY_CAUSE[code]) return CONNECTION_ERROR_CODE_BY_CAUSE[code];
  if (/timeout/i.test(message)) return ErrorCode.DATABASE_CONNECTION_TIMEOUT;
  if (/SSL|TLS|CERT/.test(code) || /SSL|certificate/i.test(message)) return ErrorCode.DATABASE_SSL_FAILED;
  return ErrorCode.DATABASE_CONNECTION_FAILED;
}
