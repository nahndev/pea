'use client';

import type { RuleConfigProps } from '../../rules.types';
import { RuleConfigForm } from './rule-config-form';

const FIELDS = ['minRows'] as const;

export function UnusedIndexRuleConfig({ rule }: RuleConfigProps) {
  return (
    <RuleConfigForm
      rule={rule}
      fields={FIELDS}
      hint="An issue is created for each index never scanned since statistics were reset. Unique and primary key indexes, and tables with fewer rows than the minimum, are ignored."
    />
  );
}
