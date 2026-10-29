import type { RuleType, Severity } from '@tomato/constants';
import { z } from 'zod';
import { isRuleConfigField, type RuleConfigField } from './rules.constants';

const numeric = z.string().trim().min(1, 'invalid').transform(Number);

const FIELD_SCHEMAS = {
  thresholdMs: numeric.pipe(z.number('invalid').int('invalid').min(1, 'invalid')),
  maxPercent: numeric.pipe(z.number('invalid').min(0, 'invalid').max(100, 'invalid')),
  minRequests: numeric.pipe(z.number('invalid').int('invalid').min(1, 'invalid')),
} satisfies Record<RuleConfigField, z.ZodType>;

export const buildRuleConfigSchema = (fields: string[]) =>
  z.object(Object.fromEntries(fields.filter(isRuleConfigField).map((field) => [field, FIELD_SCHEMAS[field]])));

export const ruleDescriptionSchema = z.string().trim().min(1, 'required').max(255, 'too_long');

export type RuleConfigInput = Partial<Record<RuleConfigField, number>>;

export interface RuleUpdateInput extends RuleConfigInput {
  severity?: Severity;
}

export interface CreateRuleInput {
  type: RuleType;
  description: string;
  severity: Severity;
  config: RuleConfigInput;
}
