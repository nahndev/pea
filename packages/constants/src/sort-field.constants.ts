export const BranchSortField = {
  NAME: 'name',
  ANALYSIS_COUNT: 'analysisCount',
  LATEST_ANALYSIS_AT: 'latestAnalysisAt',
} as const;

export type BranchSortField = (typeof BranchSortField)[keyof typeof BranchSortField];

export const AnalysisSortField = {
  TITLE: 'title',
  CREATED_AT: 'createdAt',
  STATUS: 'status',
  ISSUE_COUNT: 'issueCount',
} as const;

export type AnalysisSortField = (typeof AnalysisSortField)[keyof typeof AnalysisSortField];

export const IssueSortField = {
  SEVERITY: 'severity',
  RULE: 'rule',
  DESCRIPTION: 'description',
  STATUS: 'status',
  ISSUE_COUNT: 'issueCount',
  CREATED_AT: 'createdAt',
} as const;

export type IssueSortField = (typeof IssueSortField)[keyof typeof IssueSortField];

export const MetricResultSortField = {
  METRIC: 'metric',
  SUBJECT: 'subject',
  VALUE: 'value',
  UNIT: 'unit',
} as const;

export type MetricResultSortField = (typeof MetricResultSortField)[keyof typeof MetricResultSortField];

export const MetricHistorySortField = {
  ANALYSIS: 'analysis',
  BRANCH: 'branch',
  SUBJECT: 'subject',
  VALUE: 'value',
  CREATED_AT: 'createdAt',
} as const;

export type MetricHistorySortField = (typeof MetricHistorySortField)[keyof typeof MetricHistorySortField];

export const MetricSortField = {
  TYPE: 'type',
  DESCRIPTION: 'description',
  UNIT: 'unit',
  STATUS: 'status',
} as const;

export type MetricSortField = (typeof MetricSortField)[keyof typeof MetricSortField];

export const RuleSortField = {
  DESCRIPTION: 'description',
  SEVERITY: 'severity',
  TYPE: 'type',
} as const;

export type RuleSortField = (typeof RuleSortField)[keyof typeof RuleSortField];

export const ConditionSortField = {
  METRIC: 'metric',
  THRESHOLD: 'threshold',
  STATUS: 'status',
} as const;

export type ConditionSortField = (typeof ConditionSortField)[keyof typeof ConditionSortField];

export const DatabaseSortField = {
  NAME: 'name',
  ADDRESS: 'address',
  ANALYSIS_COUNT: 'analysisCount',
  UPDATED_AT: 'updatedAt',
} as const;

export type DatabaseSortField = (typeof DatabaseSortField)[keyof typeof DatabaseSortField];
