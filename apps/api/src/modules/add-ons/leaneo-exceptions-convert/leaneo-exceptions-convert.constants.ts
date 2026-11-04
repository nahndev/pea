export const OUTPUT_FILE_NAME = 'bug_log.log';

export const MAX_TYPE_LENGTH = 255;
export const MAX_MESSAGE_LENGTH = 500;

/** Frames under this directory are application code; the first one locates the error */
export const APP_SOURCE_DIR = '/src/';

export const UNCAUGHT_EXCEPTION_PREFIX = 'Uncaught PHP Exception';
export const SERVER_ERROR_STATUS = 500;

export const HTTP_STATUS_BY_EXCEPTION: Readonly<Record<string, number>> = {
  BadRequestHttpException: 400,
  UnauthorizedHttpException: 401,
  AccessDeniedHttpException: 403,
  NotFoundHttpException: 404,
  MethodNotAllowedHttpException: 405,
  ConflictHttpException: 409,
  GoneHttpException: 410,
  UnprocessableEntityHttpException: 422,
  TooManyRequestsHttpException: 429,
  ServiceUnavailableHttpException: 503,
};

export const NO_ROUTE_MESSAGE = /No route found for "([A-Z]+) ([^"\s]+)"/;

/** Personal data and ids replaced in messages, in order */
export const MESSAGE_REPLACEMENTS: readonly [RegExp, string][] = [
  [/\[[^\]]*\]/g, ' '],
  [/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '{email}'],
  [/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '{id}'],
  [/\b\d{1,3}(\.\d{1,3}){3}\b/g, '{ip}'],
  [/\+?\d[\d .-]{6,}\d/g, '{n}'],
  [/\d+\.\d+|\d{3,}/g, '{n}'],
  [/\b[0-9a-f]{16,}\b/gi, '{id}'],
  [/\s+/g, ' '],
];
