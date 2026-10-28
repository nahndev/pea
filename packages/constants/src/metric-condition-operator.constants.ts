export const MetricConditionOperator = {
  GT: 'GT',
  GTE: 'GTE',
  LT: 'LT',
  LTE: 'LTE',
} as const;

export type MetricConditionOperator = (typeof MetricConditionOperator)[keyof typeof MetricConditionOperator];
