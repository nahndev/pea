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
