export const MetricType = {
  P50: 'P50',
  P90: 'P90',
  P95: 'P95',
} as const;

export type MetricType = (typeof MetricType)[keyof typeof MetricType];
