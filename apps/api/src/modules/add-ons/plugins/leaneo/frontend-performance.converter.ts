import type { LineConverter } from '../../add-ons.types';
import type { PageLoad } from './leaneo.types';

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const asText = (value: unknown): string | undefined => (typeof value === 'string' && value.trim() ? value : undefined);

const toTimestamp = (value: unknown): string | undefined => {
  const ms = typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isNaN(ms) ? undefined : new Date(ms).toISOString();
};

/** `frontend_performance.log` line → `frontend_metric` line (docs/frontend_metric.md); `batch` ids and slow request urls are dropped */
export const convertFrontendPerformanceLine: LineConverter = (line) => {
  const entry = asRecord(JSON.parse(line));
  const metric = asRecord(asRecord(entry?.context)?.metric);
  const duration = asNumber(metric?.duration);
  if (!metric || duration === undefined || duration < 0) return null;

  const detail = asRecord(metric.detail);
  const pageLoad: PageLoad = {
    '@timestamp': toTimestamp(entry?.datetime),
    name: asText(metric.name),
    source: asText(metric.source),
    route: asText(metric.route),
    previousRoute: asText(metric.previousRoute) ?? null,
    status: asText(metric.status),
    startTime: asNumber(metric.startTime),
    duration,
    visibleDuration: asNumber(metric.visibleDuration),
    requestCount: asNumber(detail?.requestCount),
    requestDuration: asNumber(detail?.requestDuration),
    longFrameCount: asNumber(detail?.longFrameCount),
    longFrameDuration: asNumber(detail?.longFrameDuration),
    addedNodes: asNumber(detail?.addedNodes),
  };
  return pageLoad;
};
