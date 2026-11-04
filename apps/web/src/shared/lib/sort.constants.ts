export const SortTable = {
  BRANCHES: 'branches',
  ANALYSES: 'analyses',
  ISSUES: 'issues',
  METRICS: 'metrics',
  METRIC_RESULTS: 'metric-results',
  METRIC_HISTORY: 'metric-history',
  RULES: 'rules',
  CONDITIONS: 'conditions',
  DATABASES: 'databases',
} as const;
export type SortTable = (typeof SortTable)[keyof typeof SortTable];

export const ORDERING_COOKIE_PREFIX = 'pea-ordering-';

export const ORDERING_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
