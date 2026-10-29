export const RULE_CONFIG_FIELDS = {
  thresholdMs: { label: 'Threshold', unit: 'ms', step: 1 },
  maxPercent: { label: 'Max share', unit: '%', step: 0.1 },
  minRequests: { label: 'Min requests', unit: '', step: 1 },
} as const;

export type RuleConfigField = keyof typeof RULE_CONFIG_FIELDS;

export const isRuleConfigField = (field: string): field is RuleConfigField => field in RULE_CONFIG_FIELDS;
