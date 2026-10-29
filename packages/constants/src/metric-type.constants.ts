export const MetricType = {
  P50: 'P50',
  P90: 'P90',
  P95: 'P95',
  ENDPOINT_P95: 'ENDPOINT_P95',
  BLOCKER_ISSUE_COUNT: 'BLOCKER_ISSUE_COUNT',
  HIGH_ISSUE_COUNT: 'HIGH_ISSUE_COUNT',
  MEDIUM_ISSUE_COUNT: 'MEDIUM_ISSUE_COUNT',
  LOW_ISSUE_COUNT: 'LOW_ISSUE_COUNT',
  INFO_ISSUE_COUNT: 'INFO_ISSUE_COUNT',
} as const;

export type MetricType = (typeof MetricType)[keyof typeof MetricType];
