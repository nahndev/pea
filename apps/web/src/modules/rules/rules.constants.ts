export const RULE_CONFIG_FIELDS = {
  thresholdMs: { label: 'Threshold', unit: 'ms', step: 1 },
  maxPercent: { label: 'Max share', unit: '%', step: 0.1 },
  minRequests: { label: 'Min requests', unit: '', step: 1 },
  minCalls: { label: 'Min calls', unit: '', step: 1 },
  minRows: { label: 'Min rows', unit: '', step: 1 },
  minPercent: { label: 'Min share', unit: '%', step: 0.1 },
} as const;

export type RuleConfigField = keyof typeof RULE_CONFIG_FIELDS;

export const isRuleConfigField = (field: string): field is RuleConfigField => field in RULE_CONFIG_FIELDS;
