import { RuleType } from '@tomato/constants';

export const RULE_CONFIG_FIELDS = {
  thresholdMs: { label: 'Threshold', unit: 'ms', step: 1 },
  maxPercent: { label: 'Max share', unit: '%', step: 0.1 },
  minRequests: { label: 'Min requests', unit: '', step: 1 },
  minCalls: { label: 'Min calls', unit: '', step: 1 },
  minRows: { label: 'Min rows', unit: '', step: 1 },
  minPercent: { label: 'Min share', unit: '%', step: 0.1 },
  maxRatio: { label: 'Max ratio', unit: '×', step: 0.1 },
  maxRows: { label: 'Max rows', unit: '', step: 0.1 },
  maxBlocks: { label: 'Max blocks', unit: '', step: 1 },
  maxBytes: { label: 'Max size', unit: 'B', step: 1 },
  maxItems: { label: 'Max items', unit: '', step: 1 },
  minCount: { label: 'Min occurrences', unit: '', step: 1 },
} as const;

export type RuleConfigField = keyof typeof RULE_CONFIG_FIELDS;

export const isRuleConfigField = (field: string): field is RuleConfigField => field in RULE_CONFIG_FIELDS;

/** Rules read from `pg_stat_statements`; they report nothing without the extension. */
export const PG_STAT_STATEMENTS_RULE_CONFIG: Partial<Record<RuleType, { fields: readonly RuleConfigField[]; hint: string }>> = {
  [RuleType.HIGH_TOTAL_TIME_QUERY]: {
    fields: ['thresholdMs'],
    hint: 'An issue is created for each query whose total execution time since the statistics reset is above the threshold, however fast each call is.',
  },
  [RuleType.MAX_TIME_SPIKE_QUERY]: {
    fields: ['thresholdMs', 'maxRatio', 'minCalls'],
    hint: 'An issue is created for each query whose max execution time is above the threshold and more than the max ratio times its mean.',
  },
  [RuleType.UNSTABLE_QUERY]: {
    fields: ['maxRatio', 'minCalls'],
    hint: 'An issue is created for each query whose standard deviation of execution time is more than the max ratio times its mean.',
  },
  [RuleType.FREQUENT_QUERY]: {
    fields: ['minCalls'],
    hint: 'An issue is created for each query called at least the min calls since the statistics reset.',
  },
  [RuleType.N_PLUS_ONE_QUERY]: {
    fields: ['minCalls', 'maxRows'],
    hint: 'An issue is created for each SELECT filtered by a parameter, called at least the min calls and returning at most the max rows per call: likely run once per parent row (N+1).',
  },
  [RuleType.LARGE_RESULT_QUERY]: {
    fields: ['maxRows', 'minCalls'],
    hint: 'An issue is created for each SELECT returning more than the max rows per call on average.',
  },
  [RuleType.UNLIMITED_SELECT_QUERY]: {
    fields: ['maxRows', 'minCalls'],
    hint: 'An issue is created for each SELECT without LIMIT / FETCH returning more than the max rows per call on average.',
  },
  [RuleType.SELECT_STAR_QUERY]: {
    fields: ['minCalls'],
    hint: 'An issue is created for each query selecting every column (SELECT *) called at least the min calls.',
  },
  [RuleType.MISSING_INDEX_QUERY]: {
    fields: ['maxRatio', 'minCalls'],
    hint: 'An issue is created for each query reading more than the max ratio blocks per row, a hint of a sequential scan on a missing index.',
  },
  [RuleType.DISK_READ_QUERY]: {
    fields: ['maxBlocks', 'minCalls'],
    hint: 'An issue is created for each query reading more than the max blocks per call from disk (shared_blks_read).',
  },
  [RuleType.LOW_CACHE_HIT_QUERY]: {
    fields: ['minPercent', 'minCalls'],
    hint: 'An issue is created for each query whose share of blocks found in the buffer cache is below the min share.',
  },
  [RuleType.DIRTIED_BUFFERS_QUERY]: {
    fields: ['maxBlocks', 'minCalls'],
    hint: 'An issue is created for each query dirtying more than the max blocks per call (shared_blks_dirtied).',
  },
  [RuleType.WRITTEN_BUFFERS_QUERY]: {
    fields: ['maxBlocks', 'minCalls'],
    hint: 'An issue is created for each query writing more than the max blocks per call itself (shared_blks_written), instead of the background writer.',
  },
  [RuleType.TEMP_FILE_QUERY]: {
    fields: ['maxBlocks', 'minCalls'],
    hint: 'An issue is created for each query writing more than the max temp blocks per call: its sorts or hashes exceed work_mem.',
  },
  [RuleType.LOCAL_BUFFER_QUERY]: {
    fields: ['maxBlocks', 'minCalls'],
    hint: 'An issue is created for each query using more than the max local blocks per call (temporary tables).',
  },
  [RuleType.HIGH_WAL_QUERY]: {
    fields: ['maxBytes', 'minCalls'],
    hint: 'An issue is created for each query generating more than the max size of WAL per call.',
  },
  [RuleType.HIGH_IO_TIME_QUERY]: {
    fields: ['thresholdMs', 'minCalls'],
    hint: 'An issue is created for each query spending more than the threshold per call reading or writing blocks. Needs track_io_timing.',
  },
  [RuleType.SLOW_PLANNING_QUERY]: {
    fields: ['thresholdMs', 'minCalls'],
    hint: 'An issue is created for each query whose mean planning time is above the threshold. Needs pg_stat_statements.track_planning.',
  },
  [RuleType.PLAN_OVER_EXEC_QUERY]: {
    fields: ['minCalls'],
    hint: 'An issue is created for each query spending more time planning than executing. Needs pg_stat_statements.track_planning.',
  },
  [RuleType.HIGH_JIT_QUERY]: {
    fields: ['maxPercent', 'minCalls'],
    hint: 'An issue is created for each query whose JIT compilation takes more than the max share of its execution time (PostgreSQL 15+).',
  },
  [RuleType.OFFSET_PAGINATION_QUERY]: {
    fields: ['minCalls'],
    hint: 'An issue is created for each query paginating with OFFSET called at least the min calls.',
  },
  [RuleType.LIKE_QUERY]: {
    fields: ['minCalls'],
    hint: 'An issue is created for each query filtering with LIKE / ILIKE called at least the min calls.',
  },
  [RuleType.FUNCTION_IN_WHERE_QUERY]: {
    fields: ['minCalls'],
    hint: 'An issue is created for each query wrapping a column in a function in WHERE (lower(email) = $1), which a plain index cannot serve.',
  },
  [RuleType.ORDER_BY_RANDOM_QUERY]: {
    fields: ['minCalls'],
    hint: 'An issue is created for each query sorting by random() called at least the min calls.',
  },
  [RuleType.LONG_IN_LIST_QUERY]: {
    fields: ['maxItems', 'minCalls'],
    hint: 'An issue is created for each query with an IN list longer than the max items.',
  },
  [RuleType.FREQUENT_COUNT_QUERY]: {
    fields: ['minCalls'],
    hint: 'An issue is created for each COUNT(*) query called at least the min calls.',
  },
  [RuleType.UNFILTERED_WRITE_QUERY]: {
    fields: ['minCalls'],
    hint: 'An issue is created for each UPDATE / DELETE without WHERE called at least the min calls.',
  },
  [RuleType.MASS_WRITE_QUERY]: {
    fields: ['maxRows', 'minCalls'],
    hint: 'An issue is created for each UPDATE / DELETE affecting more than the max rows per call on average.',
  },
  [RuleType.ROW_BY_ROW_INSERT_QUERY]: {
    fields: ['minCalls'],
    hint: 'An issue is created for each single-row INSERT called at least the min calls; batch them instead.',
  },
  [RuleType.CPU_INTENSIVE_QUERY]: {
    fields: ['thresholdMs', 'maxPercent', 'minCalls'],
    hint: 'An issue is created for each query whose execution time without I/O is above the threshold per call while I/O is at most the max share. Needs track_io_timing.',
  },
  [RuleType.IO_INTENSIVE_QUERY]: {
    fields: ['maxPercent'],
    hint: 'An issue is created for each query reading or writing more than the max share of the database blocks.',
  },
  [RuleType.DATABASE_WORKLOAD]: {
    fields: ['maxPercent'],
    hint: 'An issue is created for each database taking more than the max share of the statement execution time of the server.',
  },
  [RuleType.ROLE_WORKLOAD]: {
    fields: ['maxPercent'],
    hint: 'An issue is created for each role taking more than the max share of the statement execution time of the database.',
  },
  [RuleType.CHANGED_QUERY]: {
    fields: ['minCalls', 'maxRatio'],
    hint: 'Compared with the previous run on this database: an issue is created for each new query, or query whose share of execution time grew more than the max ratio, with at least the min calls since.',
  },
  [RuleType.REGRESSED_QUERY]: {
    fields: ['maxRatio', 'minCalls'],
    hint: 'Compared with the previous run on this database: an issue is created for each query whose mean over the calls since is more than the max ratio times its previous mean.',
  },
  [RuleType.EXPENSIVE_UTILITY_COMMAND]: {
    fields: ['thresholdMs'],
    hint: 'An issue is created for each utility command (VACUUM, ANALYZE, CREATE INDEX, COPY…) whose mean duration is above the threshold.',
  },
  [RuleType.NESTED_QUERY]: {
    fields: ['thresholdMs', 'minCalls'],
    hint: 'An issue is created for each query run inside functions / procedures whose mean duration is above the threshold. Needs pg_stat_statements.track = all.',
  },
  [RuleType.STATEMENT_EVICTION]: {
    fields: ['maxPercent'],
    hint: 'An issue is created when pg_stat_statements evicted statements since its reset, or tracks more than the max share of pg_stat_statements.max.',
  },
  [RuleType.QUERY_VARIANTS]: {
    fields: ['maxItems'],
    hint: 'An issue is created for each query shape split into more than the max items query ids (IN lists of varying length, generated names…).',
  },
  [RuleType.TIME_SHARE_QUERY]: {
    fields: ['maxPercent'],
    hint: 'An issue is created for each query taking more than the max share of the database execution time.',
  },
  [RuleType.READ_WRITE_RATIO]: {
    fields: ['maxPercent'],
    hint: 'An issue is created when INSERT / UPDATE / DELETE / MERGE are more than the max share of the calls.',
  },
};
