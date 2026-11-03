export interface RuleConfig {
  thresholdMs?: number;
  maxPercent?: number;
  minRequests?: number;
  minCalls?: number;
  minRows?: number;
  minPercent?: number;
}

export interface LatencyStat {
  label: string;
  sql: (column: string) => string;
}

export interface RateDefinition {
  label: (config: RuleConfig) => string;
  condition: (config: RuleConfig) => string | null;
}
