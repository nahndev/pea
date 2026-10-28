export const MetricEvaluationStatus = {
  PASSED: 'PASSED',
  FAILED: 'FAILED',
} as const;

export type MetricEvaluationStatus = (typeof MetricEvaluationStatus)[keyof typeof MetricEvaluationStatus];
