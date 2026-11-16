import { RuleType } from '@tomato/constants';
import { API_METRIC_DURATION_COLUMN, API_METRIC_STATUS_CODE_COLUMN } from '../files/api-metric-requests';
import { BUG_LOG_IS_CRITICAL_COLUMN } from '../files/bug-log-events';
import {
  FRONTEND_DURATION_COLUMN,
  FRONTEND_IS_ABORTED_COLUMN,
  FRONTEND_LONG_FRAME_COLUMN,
  FRONTEND_REQUEST_COUNT_COLUMN,
  FRONTEND_VISIBLE_COLUMN,
} from '../files/frontend-page-loads';
import type { ErrorGroupRule, LatencyStat, PageRule, RateDefinition, RuleConfig } from './rules.types';

export const DEFAULT_MIN_REQUESTS = 10;
export const ROUTE_PERCENTILE = 0.95;
/** Issues created per database rule, worst first */
export const MAX_DATABASE_ISSUES = 100;
/** Issues created per bug rule, most frequent first */
export const MAX_BUG_ISSUES = 100;
/** Issues created per frontend rule, worst first */
export const MAX_FRONTEND_ISSUES = 100;
export const MAX_ISSUE_MESSAGE_LENGTH = 200;

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

export const ERROR_GROUP_RULE_BY_TYPE: ReadonlyMap<string, ErrorGroupRule> = new Map([
  [RuleType.CRITICAL_ERROR, { condition: BUG_LOG_IS_CRITICAL_COLUMN, describe: (count: number) => `${count} critical occurrences` }],
  [RuleType.FREQUENT_ERROR, { condition: 'true', describe: (count: number) => `Raised ${count} times` }],
]);

const p95 = (column: string) => `quantile_cont(${column}, 0.95)`;

export const PAGE_RULE_BY_TYPE: ReadonlyMap<string, PageRule> = new Map([
  [
    RuleType.SLOW_PAGE,
    { value: p95(FRONTEND_DURATION_COLUMN), limit: 'thresholdMs', describe: (value: number, limit: number) => `P95 load ${value.toFixed(1)}ms exceeds threshold ${limit}ms` },
  ],
  [
    RuleType.SLOW_VISIBLE_PAGE,
    { value: p95(FRONTEND_VISIBLE_COLUMN), limit: 'thresholdMs', describe: (value: number, limit: number) => `P95 visible after ${value.toFixed(1)}ms exceeds threshold ${limit}ms` },
  ],
  [
    RuleType.LONG_FRAME_PAGE,
    { value: p95(FRONTEND_LONG_FRAME_COLUMN), limit: 'thresholdMs', describe: (value: number, limit: number) => `P95 long frames ${value.toFixed(1)}ms exceed threshold ${limit}ms` },
  ],
  [
    RuleType.CHATTY_PAGE,
    { value: p95(FRONTEND_REQUEST_COUNT_COLUMN), limit: 'maxRequests', describe: (value: number, limit: number) => `P95 ${value.toFixed(1)} requests per load exceeds ${limit}` },
  ],
  [
    RuleType.ABORTED_PAGE,
    { value: `100 * avg(${FRONTEND_IS_ABORTED_COLUMN}::int)`, limit: 'maxPercent', describe: (value: number, limit: number) => `${value.toFixed(1)}% of loads aborted, above ${limit}%` },
  ],
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
  [RuleType.SLOW_QUERY]: ['thresholdMs', 'minCalls'],
  [RuleType.LONG_RUNNING_QUERY]: ['thresholdMs'],
  [RuleType.LOCK_WAIT]: ['thresholdMs'],
  [RuleType.DEAD_TUPLE_RATE]: ['maxPercent', 'minRows'],
  [RuleType.SEQ_SCAN_RATE]: ['maxPercent', 'minRows'],
  [RuleType.UNUSED_INDEX]: ['minRows'],
  [RuleType.LOW_CACHE_HIT_RATIO]: ['minPercent'],
  [RuleType.HIGH_TOTAL_TIME_QUERY]: ['thresholdMs'],
  [RuleType.MAX_TIME_SPIKE_QUERY]: ['thresholdMs', 'maxRatio', 'minCalls'],
  [RuleType.UNSTABLE_QUERY]: ['maxRatio', 'minCalls'],
  [RuleType.FREQUENT_QUERY]: ['minCalls'],
  [RuleType.N_PLUS_ONE_QUERY]: ['minCalls', 'maxRows'],
  [RuleType.LARGE_RESULT_QUERY]: ['maxRows', 'minCalls'],
  [RuleType.UNLIMITED_SELECT_QUERY]: ['maxRows', 'minCalls'],
  [RuleType.SELECT_STAR_QUERY]: ['minCalls'],
  [RuleType.MISSING_INDEX_QUERY]: ['maxRatio', 'minCalls'],
  [RuleType.DISK_READ_QUERY]: ['maxBlocks', 'minCalls'],
  [RuleType.LOW_CACHE_HIT_QUERY]: ['minPercent', 'minCalls'],
  [RuleType.DIRTIED_BUFFERS_QUERY]: ['maxBlocks', 'minCalls'],
  [RuleType.WRITTEN_BUFFERS_QUERY]: ['maxBlocks', 'minCalls'],
  [RuleType.TEMP_FILE_QUERY]: ['maxBlocks', 'minCalls'],
  [RuleType.LOCAL_BUFFER_QUERY]: ['maxBlocks', 'minCalls'],
  [RuleType.HIGH_WAL_QUERY]: ['maxBytes', 'minCalls'],
  [RuleType.HIGH_IO_TIME_QUERY]: ['thresholdMs', 'minCalls'],
  [RuleType.SLOW_PLANNING_QUERY]: ['thresholdMs', 'minCalls'],
  [RuleType.PLAN_OVER_EXEC_QUERY]: ['minCalls'],
  [RuleType.HIGH_JIT_QUERY]: ['maxPercent', 'minCalls'],
  [RuleType.OFFSET_PAGINATION_QUERY]: ['minCalls'],
  [RuleType.LIKE_QUERY]: ['minCalls'],
  [RuleType.FUNCTION_IN_WHERE_QUERY]: ['minCalls'],
  [RuleType.ORDER_BY_RANDOM_QUERY]: ['minCalls'],
  [RuleType.LONG_IN_LIST_QUERY]: ['maxItems', 'minCalls'],
  [RuleType.FREQUENT_COUNT_QUERY]: ['minCalls'],
  [RuleType.UNFILTERED_WRITE_QUERY]: ['minCalls'],
  [RuleType.MASS_WRITE_QUERY]: ['maxRows', 'minCalls'],
  [RuleType.ROW_BY_ROW_INSERT_QUERY]: ['minCalls'],
  [RuleType.CPU_INTENSIVE_QUERY]: ['thresholdMs', 'maxPercent', 'minCalls'],
  [RuleType.IO_INTENSIVE_QUERY]: ['maxPercent'],
  [RuleType.DATABASE_WORKLOAD]: ['maxPercent'],
  [RuleType.ROLE_WORKLOAD]: ['maxPercent'],
  [RuleType.CHANGED_QUERY]: ['minCalls', 'maxRatio'],
  [RuleType.REGRESSED_QUERY]: ['maxRatio', 'minCalls'],
  [RuleType.EXPENSIVE_UTILITY_COMMAND]: ['thresholdMs'],
  [RuleType.NESTED_QUERY]: ['thresholdMs', 'minCalls'],
  [RuleType.STATEMENT_EVICTION]: ['maxPercent'],
  [RuleType.QUERY_VARIANTS]: ['maxItems'],
  [RuleType.TIME_SHARE_QUERY]: ['maxPercent'],
  [RuleType.READ_WRITE_RATIO]: ['maxPercent'],
  [RuleType.CRITICAL_ERROR]: ['minCount'],
  [RuleType.FREQUENT_ERROR]: ['minCount'],
  [RuleType.ERROR_ENDPOINT]: ['minCount'],
  [RuleType.SLOW_PAGE]: ['thresholdMs', 'minLoads'],
  [RuleType.SLOW_VISIBLE_PAGE]: ['thresholdMs', 'minLoads'],
  [RuleType.LONG_FRAME_PAGE]: ['thresholdMs', 'minLoads'],
  [RuleType.CHATTY_PAGE]: ['maxRequests', 'minLoads'],
  [RuleType.ABORTED_PAGE]: ['maxPercent', 'minLoads'],
};
