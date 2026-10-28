export const RuleType = {
  SQL: 'SQL',
  API_METRIC: 'API_METRIC',
} as const;

export type RuleType = (typeof RuleType)[keyof typeof RuleType];
