export interface RuleConfig {
  thresholdMs?: number;
  maxPercent?: number;
  minRequests?: number;
  minCalls?: number;
  minRows?: number;
  minPercent?: number;
  maxRatio?: number;
  maxRows?: number;
  maxBlocks?: number;
  maxBytes?: number;
  maxItems?: number;
  minCount?: number;
  minLoads?: number;
  maxRequests?: number;
}

export interface LatencyStat {
  label: string;
  sql: (column: string) => string;
}

export interface RateDefinition {
  label: (config: RuleConfig) => string;
  condition: (config: RuleConfig) => string | null;
}

export interface StatementRow {
  query: string;
  calls: number;
  value: number;
  detail: number | null;
}

/** A bug_log rule evaluated per error group over the events matching `condition` */
export interface ErrorGroupRule {
  condition: string;
  describe: (count: number) => string;
}

/** A frontend_metric rule evaluated per page: an issue when `value` is above the config field `limit` */
export interface PageRule {
  value: string;
  limit: keyof RuleConfig;
  describe: (value: number, limit: number) => string;
}

/** A `pg_stat_statements` rule evaluated per query over the columns of `QUERY_STATEMENTS_SQL` */
export interface StatementRule {
  /** Config fields bound in order to `$1`, `$2`… of `condition` */
  params: readonly (keyof RuleConfig)[];
  value: string;
  detail?: string;
  condition: string;
  /** Defaults to `value`, worst first */
  order?: string;
  describe: (row: StatementRow, config: Required<RuleConfig>) => string;
}
