export const RuleType = {
  P50_FAILURE: 'P50_FAILURE',
  P90_FAILURE: 'P90_FAILURE',
  P95_FAILURE: 'P95_FAILURE',
} as const;

export type RuleType = (typeof RuleType)[keyof typeof RuleType];
