import { RuleType } from '@tomato/constants';
import type { StatementRule } from '../../rules.types';

const SELECT_PATTERN = String.raw`'^\s*(select|with)\y'`;
/** Keeps text patterns off DO blocks, function bodies and other utility commands */
const DML_CONDITION = String.raw`query ~* '^\s*\(*\s*(select|with|insert|update|delete|merge|table|values)\y'`;
const WRITE_PATTERN = String.raw`'^\s*(update|delete)\y'`;
const IN_LIST_LENGTH_SQL = String.raw`(SELECT max(array_length(string_to_array(m[1], ','), 1)) FROM regexp_matches(query, '\yin\s*\(((\s*\$\d+\s*,)*\s*\$\d+\s*)\)', 'gi') AS m)`;
const WHERE_FUNCTION_PATTERN = String.raw`'\ywhere\y.*\y(lower|upper|trim|btrim|ltrim|rtrim|coalesce|date|date_trunc|date_part|extract|to_char|to_date|substring|substr|left|right|length|abs|round|floor|ceil|cast)\s*\(\s*"?[a-z_][\w."]*\s*(\)|,|::|\y(from|as)\y)'`;
const UTILITY_PATTERN = String.raw`'^\s*(vacuum|analyze|cluster|reindex|copy|truncate|refresh\s+materialized\s+view|alter\s+table|create\s+(unique\s+)?index)\y'`;

const fixed = (value: number | null, digits = 1) => (value ?? 0).toFixed(digits);

/** Per-query rules over `pg_stat_statements`; counters are cumulative since the last statistics reset. */
export const STATEMENT_RULE_BY_RULE_TYPE: ReadonlyMap<string, StatementRule> = new Map<string, StatementRule>([
  [
    RuleType.HIGH_TOTAL_TIME_QUERY,
    {
      params: ['thresholdMs'],
      value: 'exec_ms',
      condition: 'exec_ms > $1',
      describe: ({ value, calls }, { thresholdMs }) => `Total ${fixed(value, 0)}ms over ${calls} calls exceeds ${thresholdMs}ms`,
    },
  ],
  [
    RuleType.MAX_TIME_SPIKE_QUERY,
    {
      params: ['thresholdMs', 'maxRatio', 'minCalls'],
      value: 'max_ms',
      detail: 'mean_ms',
      condition: 'max_ms > $1 AND max_ms > mean_ms * $2 AND calls >= $3',
      describe: ({ value, detail }) => `Max ${fixed(value)}ms is ${fixed(value / (detail || 1))}× the mean ${fixed(detail)}ms`,
    },
  ],
  [
    RuleType.UNSTABLE_QUERY,
    {
      params: ['maxRatio', 'minCalls'],
      value: 'stddev_ms / NULLIF(mean_ms, 0)',
      detail: 'mean_ms',
      condition: 'stddev_ms > mean_ms * $1 AND calls >= $2',
      order: 'stddev_ms',
      describe: ({ value, detail, calls }, { maxRatio }) =>
        `Standard deviation is ${fixed(value)}× the mean ${fixed(detail)}ms over ${calls} calls, above ${maxRatio}×`,
    },
  ],
  [
    RuleType.FREQUENT_QUERY,
    {
      params: ['minCalls'],
      value: 'calls',
      condition: 'calls >= $1',
      describe: ({ calls }, { minCalls }) => `${calls} calls since statistics reset, at least ${minCalls}`,
    },
  ],
  [
    RuleType.N_PLUS_ONE_QUERY,
    {
      params: ['minCalls', 'maxRows'],
      value: 'calls',
      detail: 'rows / calls',
      condition: String.raw`calls >= $1 AND rows / calls <= $2 AND query ~* ${SELECT_PATTERN} AND query ~ '=\s*\$\d+'`,
      describe: ({ calls, detail }) => `${calls} calls returning ${fixed(detail)} rows each, likely one per parent row (N+1)`,
    },
  ],
  [
    RuleType.LARGE_RESULT_QUERY,
    {
      params: ['maxRows', 'minCalls'],
      value: 'rows / calls',
      condition: `query ~* ${SELECT_PATTERN} AND rows / calls > $1 AND calls >= $2`,
      describe: ({ value, calls }, { maxRows }) => `${fixed(value, 0)} rows per call over ${calls} calls exceed ${maxRows}`,
    },
  ],
  [
    RuleType.UNLIMITED_SELECT_QUERY,
    {
      params: ['maxRows', 'minCalls'],
      value: 'rows / calls',
      condition: String.raw`query ~* ${SELECT_PATTERN} AND query !~* '\y(limit|fetch\s+(first|next))\y' AND rows / calls > $1 AND calls >= $2`,
      describe: ({ value }, { maxRows }) => `SELECT without LIMIT returns ${fixed(value, 0)} rows per call, above ${maxRows}`,
    },
  ],
  [
    RuleType.SELECT_STAR_QUERY,
    {
      params: ['minCalls'],
      value: 'exec_ms',
      condition: String.raw`${DML_CONDITION} AND calls >= $1 AND query ~* '\yselect\s+(distinct\s+)?([a-z_][\w$]*\.)?\*'`,
      describe: ({ value, calls }) => `Selects every column (SELECT *) over ${calls} calls, ${fixed(value, 0)}ms in total`,
    },
  ],
  [
    RuleType.MISSING_INDEX_QUERY,
    {
      params: ['maxRatio', 'minCalls'],
      value: '(shared_hit + shared_read) / greatest(rows, 1)',
      condition: `${DML_CONDITION} AND (shared_hit + shared_read) / greatest(rows, 1) > $1 AND calls >= $2`,
      order: 'shared_hit + shared_read',
      describe: ({ value }, { maxRatio }) => `${fixed(value, 0)} blocks read per row, above ${maxRatio}; likely a sequential scan (missing index)`,
    },
  ],
  [
    RuleType.DISK_READ_QUERY,
    {
      params: ['maxBlocks', 'minCalls'],
      value: 'shared_read / calls',
      detail: 'shared_read',
      condition: 'shared_read / calls > $1 AND calls >= $2',
      describe: ({ value, detail }, { maxBlocks }) => `${fixed(value, 0)} blocks read from disk per call (${detail} in total), above ${maxBlocks}`,
    },
  ],
  [
    RuleType.LOW_CACHE_HIT_QUERY,
    {
      params: ['minPercent', 'minCalls'],
      value: 'shared_hit * 100 / NULLIF(shared_hit + shared_read, 0)',
      detail: 'shared_read',
      condition: 'shared_hit * 100 / NULLIF(shared_hit + shared_read, 0) < $1 AND calls >= $2',
      order: 'shared_read',
      describe: ({ value, detail }, { minPercent }) => `Cache hit ratio ${fixed(value, 2)}% is below ${minPercent}% (${detail} blocks read from disk)`,
    },
  ],
  [
    RuleType.DIRTIED_BUFFERS_QUERY,
    {
      params: ['maxBlocks', 'minCalls'],
      value: 'shared_dirtied / calls',
      condition: 'shared_dirtied / calls > $1 AND calls >= $2',
      describe: ({ value }, { maxBlocks }) => `${fixed(value, 0)} buffers dirtied per call, above ${maxBlocks}`,
    },
  ],
  [
    RuleType.WRITTEN_BUFFERS_QUERY,
    {
      params: ['maxBlocks', 'minCalls'],
      value: 'shared_written / calls',
      condition: 'shared_written / calls > $1 AND calls >= $2',
      describe: ({ value }, { maxBlocks }) => `${fixed(value, 0)} buffers written by the backend per call, above ${maxBlocks}; shared_buffers or the background writer cannot keep up`,
    },
  ],
  [
    RuleType.TEMP_FILE_QUERY,
    {
      params: ['maxBlocks', 'minCalls'],
      value: 'temp_written / calls',
      condition: 'temp_written > 0 AND temp_written / calls > $1 AND calls >= $2',
      describe: ({ value }) => `${fixed(value, 0)} temp blocks written per call; sorts or hashes exceed work_mem`,
    },
  ],
  [
    RuleType.LOCAL_BUFFER_QUERY,
    {
      params: ['maxBlocks', 'minCalls'],
      value: 'local_blocks / calls',
      condition: 'local_blocks / calls > $1 AND calls >= $2',
      describe: ({ value }, { maxBlocks }) => `${fixed(value, 0)} temporary table blocks per call, above ${maxBlocks}`,
    },
  ],
  [
    RuleType.HIGH_WAL_QUERY,
    {
      params: ['maxBytes', 'minCalls'],
      value: 'wal_bytes / calls',
      detail: 'wal_bytes',
      condition: 'wal_bytes / calls > $1 AND calls >= $2',
      describe: ({ value, detail }, { maxBytes }) => `${fixed(value, 0)} WAL bytes per call (${detail} in total), above ${maxBytes}`,
    },
  ],
  [
    RuleType.HIGH_IO_TIME_QUERY,
    {
      params: ['thresholdMs', 'minCalls'],
      value: 'io_ms / calls',
      detail: 'io_ms * 100 / NULLIF(exec_ms, 0)',
      condition: 'io_ms / calls > $1 AND calls >= $2',
      describe: ({ value, detail }, { thresholdMs }) => `${fixed(value)}ms of I/O per call (${fixed(detail)}% of execution) exceeds ${thresholdMs}ms`,
    },
  ],
  [
    RuleType.SLOW_PLANNING_QUERY,
    {
      params: ['thresholdMs', 'minCalls'],
      value: 'plan_ms / NULLIF(plans, 0)',
      condition: 'plan_ms / NULLIF(plans, 0) > $1 AND calls >= $2',
      describe: ({ value }, { thresholdMs }) => `Mean planning ${fixed(value)}ms exceeds ${thresholdMs}ms`,
    },
  ],
  [
    RuleType.PLAN_OVER_EXEC_QUERY,
    {
      params: ['minCalls'],
      value: 'plan_ms',
      detail: 'exec_ms',
      condition: 'plan_ms > exec_ms AND calls >= $1',
      order: 'plan_ms - exec_ms',
      describe: ({ value, detail }) => `Planning ${fixed(value)}ms exceeds execution ${fixed(detail)}ms; consider a prepared statement`,
    },
  ],
  [
    RuleType.HIGH_JIT_QUERY,
    {
      params: ['maxPercent', 'minCalls'],
      value: 'least(jit_ms * 100 / NULLIF(exec_ms, 0), 100)',
      detail: 'jit_ms',
      condition: 'jit_ms * 100 / NULLIF(exec_ms, 0) > $1 AND calls >= $2',
      describe: ({ value, detail }, { maxPercent }) => `JIT takes ${fixed(value)}% of execution (${fixed(detail, 0)}ms), above ${maxPercent}%`,
    },
  ],
  [
    RuleType.OFFSET_PAGINATION_QUERY,
    {
      params: ['minCalls'],
      value: 'exec_ms',
      condition: String.raw`${DML_CONDITION} AND calls >= $1 AND query ~* '\yoffset\s+(\$\d+|\d+)'`,
      describe: ({ value, calls }) => `Paginates with OFFSET over ${calls} calls, ${fixed(value, 0)}ms in total; consider keyset pagination`,
    },
  ],
  [
    RuleType.LIKE_QUERY,
    {
      params: ['minCalls'],
      value: 'exec_ms',
      condition: String.raw`${DML_CONDITION} AND calls >= $1 AND query ~* '(\yi?like\y|~~)'`,
      describe: ({ value, calls }) => `Filters with LIKE / ILIKE over ${calls} calls, ${fixed(value, 0)}ms in total; a leading wildcard cannot use a B-tree index`,
    },
  ],
  [
    RuleType.FUNCTION_IN_WHERE_QUERY,
    {
      params: ['minCalls'],
      value: 'exec_ms',
      condition: `${DML_CONDITION} AND calls >= $1 AND query ~* ${WHERE_FUNCTION_PATTERN}`,
      describe: ({ value, calls }) => `Wraps a column in a function in WHERE over ${calls} calls, ${fixed(value, 0)}ms in total; it needs an expression index`,
    },
  ],
  [
    RuleType.ORDER_BY_RANDOM_QUERY,
    {
      params: ['minCalls'],
      value: 'exec_ms',
      condition: String.raw`${DML_CONDITION} AND calls >= $1 AND query ~* '\yorder\s+by\s+random\s*\(\s*\)'`,
      describe: ({ value, calls }) => `ORDER BY random() over ${calls} calls, ${fixed(value, 0)}ms in total; it sorts every row`,
    },
  ],
  [
    RuleType.LONG_IN_LIST_QUERY,
    {
      params: ['maxItems', 'minCalls'],
      value: IN_LIST_LENGTH_SQL,
      condition: `${DML_CONDITION} AND ${IN_LIST_LENGTH_SQL} > $1 AND calls >= $2`,
      describe: ({ value }, { maxItems }) => `IN list of ${value} values, above ${maxItems}; consider = ANY($1) or a join`,
    },
  ],
  [
    RuleType.FREQUENT_COUNT_QUERY,
    {
      params: ['minCalls'],
      value: 'calls',
      detail: 'exec_ms',
      condition: String.raw`${DML_CONDITION} AND calls >= $1 AND query ~* '\ycount\s*\(\s*(\*|1|\$\d+)\s*\)'`,
      describe: ({ calls, detail }) => `COUNT(*) ran ${calls} times, ${fixed(detail, 0)}ms in total; consider caching or an estimate`,
    },
  ],
  [
    RuleType.UNFILTERED_WRITE_QUERY,
    {
      params: ['minCalls'],
      value: 'rows',
      condition: String.raw`calls >= $1 AND query ~* ${WRITE_PATTERN} AND query !~* '\ywhere\y'`,
      describe: ({ value, calls }) => `UPDATE / DELETE without WHERE ran ${calls} times, ${value} rows affected`,
    },
  ],
  [
    RuleType.MASS_WRITE_QUERY,
    {
      params: ['maxRows', 'minCalls'],
      value: 'rows / calls',
      condition: `query ~* ${WRITE_PATTERN} AND rows / calls > $1 AND calls >= $2`,
      describe: ({ value }, { maxRows }) => `${fixed(value, 0)} rows affected per call, above ${maxRows}`,
    },
  ],
  [
    RuleType.ROW_BY_ROW_INSERT_QUERY,
    {
      params: ['minCalls'],
      value: 'calls',
      condition: String.raw`calls >= $1 AND rows <= calls AND query ~* '^\s*insert\y.*\yvalues\s*\(' AND query !~* '\yvalues\s*\(.*\)\s*,\s*\('`,
      describe: ({ calls }) => `${calls} single-row INSERTs; batch them into a multi-row INSERT or COPY`,
    },
  ],
  [
    RuleType.CPU_INTENSIVE_QUERY,
    {
      params: ['thresholdMs', 'maxPercent', 'minCalls'],
      value: '(exec_ms - io_ms) / calls',
      detail: 'io_ms * 100 / NULLIF(exec_ms, 0)',
      condition: '(exec_ms - io_ms) / calls > $1 AND coalesce(io_ms * 100 / NULLIF(exec_ms, 0), 0) <= $2 AND calls >= $3',
      order: 'exec_ms - io_ms',
      describe: ({ value, detail }, { thresholdMs }) => `${fixed(value)}ms of CPU per call exceeds ${thresholdMs}ms, I/O is only ${fixed(detail)}%`,
    },
  ],
  [
    RuleType.IO_INTENSIVE_QUERY,
    {
      params: ['maxPercent'],
      value: 'io_blocks * 100 / NULLIF(total_io_blocks, 0)',
      detail: 'io_blocks',
      condition: 'io_blocks * 100 / NULLIF(total_io_blocks, 0) > $1',
      describe: ({ value, detail }, { maxPercent }) => `${fixed(value)}% of the database I/O (${detail} blocks), above ${maxPercent}%`,
    },
  ],
  [
    RuleType.EXPENSIVE_UTILITY_COMMAND,
    {
      params: ['thresholdMs'],
      value: 'mean_ms',
      detail: 'max_ms',
      condition: `query ~* ${UTILITY_PATTERN} AND mean_ms > $1`,
      order: 'exec_ms',
      describe: ({ value, detail, calls }, { thresholdMs }) =>
        `Mean ${fixed(value, 0)}ms (max ${fixed(detail, 0)}ms) over ${calls} runs exceeds ${thresholdMs}ms`,
    },
  ],
  [
    RuleType.NESTED_QUERY,
    {
      params: ['thresholdMs', 'minCalls'],
      value: 'nested_exec_ms / NULLIF(nested_calls, 0)',
      detail: 'nested_calls',
      condition: 'nested_exec_ms / NULLIF(nested_calls, 0) > $1 AND nested_calls >= $2',
      order: 'nested_exec_ms',
      describe: ({ value, detail }, { thresholdMs }) =>
        `Runs inside functions / procedures: mean ${fixed(value)}ms over ${detail} calls exceeds ${thresholdMs}ms`,
    },
  ],
  [
    RuleType.TIME_SHARE_QUERY,
    {
      params: ['maxPercent'],
      value: 'exec_ms * 100 / NULLIF(total_exec_ms, 0)',
      detail: 'exec_ms',
      condition: 'exec_ms * 100 / NULLIF(total_exec_ms, 0) > $1',
      describe: ({ value, detail }, { maxPercent }) => `${fixed(value)}% of the database execution time (${fixed(detail, 0)}ms), above ${maxPercent}%`,
    },
  ],
]);
