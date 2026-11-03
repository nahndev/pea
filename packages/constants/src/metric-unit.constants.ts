export const MetricUnit = {
  MILLISECOND: 'MILLISECOND',
  COUNT: 'COUNT',
  PERCENT: 'PERCENT',
} as const;

export type MetricUnit = (typeof MetricUnit)[keyof typeof MetricUnit];
