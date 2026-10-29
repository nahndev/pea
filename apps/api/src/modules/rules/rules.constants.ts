import { RuleType } from '@tomato/constants';
import { API_METRIC_DURATION_COLUMN } from '../files/api-metric-durations';
import { API_METRIC_STATUS_CODE_COLUMN } from '../files/api-metric-requests';
import type { LatencyStat, RateDefinition, RuleConfig } from './rules.types';

export const DEFAULT_MIN_REQUESTS = 10;
export const ROUTE_PERCENTILE = 0.95;

export const SERVER_ERROR_CONDITION = `${API_METRIC_STATUS_CODE_COLUMN} BETWEEN 500 AND 599`;
const CLIENT_ERROR_CONDITION = `${API_METRIC_STATUS_CODE_COLUMN} BETWEEN 400 AND 499`;

export const LATENCY_STAT_BY_RULE_TYPE: ReadonlyMap<string, LatencyStat> = new Map([
  [RuleType.P50_FAILURE, { label: 'P50', sql: (column: string) => `quantile_cont(${column}, 0.5)` }],
  [RuleType.P90_FAILURE, { label: 'P90', sql: (column: string) => `quantile_cont(${column}, 0.9)` }],
  [RuleType.P95_FAILURE, { label: 'P95', sql: (column: string) => `quantile_cont(${column}, 0.95)` }],
  [RuleType.P99_FAILURE, { label: 'P99', sql: (column: string) => `quantile_cont(${column}, 0.99)` }],
  [RuleType.AVG_LATENCY, { label: 'Average', sql: (column: string) => `avg(${column})` }],
  [RuleType.MAX_LATENCY, { label: 'Max', sql: (column: string) => `max(${column})` }],
]);

export const RATE_BY_RULE_TYPE: ReadonlyMap<string, RateDefinition> = new Map([
  [
    RuleType.SLOW_REQUEST_RATE,
    {
      label: ({ thresholdMs }: { thresholdMs?: number }) => `Slow request rate (>${thresholdMs}ms)`,
      condition: ({ thresholdMs }: { thresholdMs?: number }) =>
        typeof thresholdMs === 'number' ? `${API_METRIC_DURATION_COLUMN} > ${thresholdMs}` : null,
    },
  ],
  [RuleType.ERROR_RATE, { label: () => '5xx error rate', condition: () => SERVER_ERROR_CONDITION }],
  [RuleType.CLIENT_ERROR_RATE, { label: () => '4xx error rate', condition: () => CLIENT_ERROR_CONDITION }],
]);

export const CONFIG_FIELDS_BY_RULE_TYPE: Readonly<Record<RuleType, readonly (keyof RuleConfig)[]>> = {
  [RuleType.P50_FAILURE]: ['thresholdMs'],
  [RuleType.P90_FAILURE]: ['thresholdMs'],
  [RuleType.P95_FAILURE]: ['thresholdMs'],
  [RuleType.P99_FAILURE]: ['thresholdMs'],
  [RuleType.AVG_LATENCY]: ['thresholdMs'],
  [RuleType.MAX_LATENCY]: ['thresholdMs'],
  [RuleType.SLOW_REQUEST_RATE]: ['thresholdMs', 'maxPercent'],
  [RuleType.ERROR_RATE]: ['maxPercent'],
  [RuleType.CLIENT_ERROR_RATE]: ['maxPercent'],
  [RuleType.SLOW_ROUTE]: ['thresholdMs', 'minRequests'],
  [RuleType.SLOW_API]: ['thresholdMs'],
  [RuleType.ROUTE_ERROR_RATE]: ['maxPercent', 'minRequests'],
};
