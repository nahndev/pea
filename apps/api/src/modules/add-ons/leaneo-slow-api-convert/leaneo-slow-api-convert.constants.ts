export const SERVICE_NAME = 'leaneo';
export const SCOPE_NAME = 'leaneo.api_metric';
export const DURATION_UNIT = 's';
export const OUTPUT_FILE_NAME = 'api_metric.log';

export const EXPLICIT_BOUNDS = [0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10];

export const REQUEST_TIME_KEYS = ['requestTime: ', 'requestTime'];
export const ID_SEGMENT = /^(-?\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
export const ID_PLACEHOLDER = '{id}';

export const MICROS_PER_SECOND = 1e6;
export const NANOS_PER_MICRO = 1000n;
