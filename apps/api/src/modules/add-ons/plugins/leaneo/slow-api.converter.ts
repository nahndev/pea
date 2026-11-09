import type { LineConverter } from '../../add-ons.types';
import { MS_PER_SECOND } from './leaneo.constants';
import type { SlowApiRecord } from './leaneo.types';
import { toRoute } from './to-route';

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const parse = (raw: string): SlowApiRecord | null => {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }

  const entry = asRecord(json);
  const context = asRecord(entry?.context);
  const request = asRecord(context?.request);
  const durationMs = asNumber(context?.elapsedMilleSecond);
  if (typeof request?.url !== 'string' || typeof request.method !== 'string') return null;
  if (durationMs === undefined || durationMs < 0) return null;

  const datetimeSeconds = typeof entry?.datetime === 'string' ? Date.parse(entry.datetime) / MS_PER_SECOND : NaN;
  const endSeconds = asNumber(context?.responseTime) ?? (Number.isNaN(datetimeSeconds) ? undefined : datetimeSeconds);
  if (endSeconds === undefined) return null;

  return { url: request.url, method: request.method, durationMs, endSeconds };
};

/** `slow_api.log` line → `api_metric` line (docs/api_metric.md) */
export const convertSlowApiLine: LineConverter = (line) => {
  const record = parse(line);
  if (!record) return null;
  return {
    ts: Math.round(record.endSeconds * MS_PER_SECOND),
    method: record.method.toUpperCase(),
    route: toRoute(record.url),
    ms: record.durationMs,
  };
};
