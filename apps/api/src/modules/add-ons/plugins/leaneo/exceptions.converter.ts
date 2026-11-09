import type { LineConverter } from '../../add-ons.types';
import {
  HTTP_STATUS_BY_EXCEPTION,
  MAX_MESSAGE_LENGTH,
  MAX_TYPE_LENGTH,
  MESSAGE_REPLACEMENTS,
  NO_ROUTE_MESSAGE,
  PROJECT_ROOT,
  SERVER_ERROR_STATUS,
  UNCAUGHT_EXCEPTION_PREFIX,
} from './leaneo.constants';
import type { BugEvent } from './leaneo.types';
import { toRoute } from './to-route';

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined;

const asText = (value: unknown): string | undefined => (typeof value === 'string' && value.trim() ? value : undefined);

const normalize = (text: string, max: number): string | undefined =>
  MESSAGE_REPLACEMENTS.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), text)
    .trim()
    .slice(0, max) || undefined;

const toPath = (url: string): string => {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
};

const parse = (raw: string): BugEvent | null => {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }

  const entry = asRecord(json);
  const context = asRecord(entry?.context);
  const exception = asRecord(context?.exception);
  const rawMessage = asText(entry?.message);
  const message = rawMessage && normalize(rawMessage, MAX_TYPE_LENGTH);
  const errorType = asText(exception?.class)?.split('\\').pop();
  if (!errorType && !message) return null;

  const ts = typeof entry?.datetime === 'string' ? Date.parse(entry.datetime) : NaN;
  const errorMessage = asText(exception?.message);
  return {
    '@timestamp': Number.isNaN(ts) ? undefined : new Date(ts).toISOString(),
    'log.level': asText(entry?.level_name)?.toLowerCase(),
    message,
    ...toEndpoint(context, rawMessage),
    'http.response.status_code': toStatus(errorType, exception?.code, rawMessage),
    'error.type': errorType,
    'error.message': errorMessage && normalize(errorMessage, MAX_MESSAGE_LENGTH),
    'error.stack_trace': toStackTrace(exception),
  };
};

const toStackTrace = (exception: Record<string, unknown> | undefined): string | undefined => {
  const trace = Array.isArray(exception?.trace) ? exception.trace : [];
  const frames = [exception?.file, ...trace].filter((value): value is string => typeof value === 'string' && value.trim() !== '');
  return frames.length > 0 ? frames.map((frame) => frame.replace(PROJECT_ROOT, '')).join('\n') : undefined;
};

const toEndpoint = (context: Record<string, unknown> | undefined, message: string | undefined): Pick<BugEvent, 'http.request.method' | 'url.path'> => {
  const api = asText(context?.api);
  if (api) return { 'url.path': toRoute(api) };
  const [, method, url] = message?.match(NO_ROUTE_MESSAGE) ?? [];
  return url ? { 'http.request.method': method, 'url.path': toRoute(toPath(url)) } : {};
};

const toStatus = (exceptionClass: string | undefined, code: unknown, message: string | undefined): number | undefined => {
  const status = exceptionClass && HTTP_STATUS_BY_EXCEPTION[exceptionClass];
  if (status) return status;
  if (message?.startsWith(UNCAUGHT_EXCEPTION_PREFIX)) return SERVER_ERROR_STATUS;
  return typeof code === 'number' && code >= 400 && code <= 599 ? code : undefined;
};

/** Monolog `exceptions.log` line → `bug_log` line (docs/bug_log.md) */
export const convertExceptionLine: LineConverter = (line) => parse(line);
