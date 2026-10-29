export const MetricUnit = {
  MILLISECOND: 'MILLISECOND',
  COUNT: 'COUNT',
} as const;

export type MetricUnit = (typeof MetricUnit)[keyof typeof MetricUnit];
