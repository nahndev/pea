import { describe, expect, it } from 'vitest';
import { buildRuleConfigSchema } from './rules.schemas';

const messages = (fields: string[], input: unknown) => {
  const result = buildRuleConfigSchema(fields).safeParse(input);
  return result.success ? [] : result.error.issues.map(({ path, message }) => `${path.join('.')}:${message}`);
};

describe('buildRuleConfigSchema', () => {
  it('coerces the fields of the rule to numbers', () => {
    expect(buildRuleConfigSchema(['thresholdMs', 'maxPercent']).parse({ thresholdMs: '2000', maxPercent: '2.5' })).toEqual({
      thresholdMs: 2000,
      maxPercent: 2.5,
    });
  });

  it('ignores fields the rule does not have', () => {
    expect(buildRuleConfigSchema(['thresholdMs']).parse({ thresholdMs: '10', maxPercent: '5' })).toEqual({ thresholdMs: 10 });
  });

  it('rejects empty and non-numeric values', () => {
    expect(messages(['thresholdMs'], { thresholdMs: '  ' })).toEqual(['thresholdMs:invalid']);
    expect(messages(['thresholdMs'], { thresholdMs: 'abc' })).toEqual(['thresholdMs:invalid']);
  });

  it('enforces the range of each field', () => {
    expect(messages(['thresholdMs'], { thresholdMs: '0' })).toEqual(['thresholdMs:invalid']);
    expect(messages(['thresholdMs'], { thresholdMs: '1.5' })).toEqual(['thresholdMs:invalid']);
    expect(messages(['maxPercent'], { maxPercent: '101' })).toEqual(['maxPercent:invalid']);
    expect(messages(['maxPercent'], { maxPercent: '0' })).toEqual([]);
    expect(messages(['minRequests'], { minRequests: '0' })).toEqual(['minRequests:invalid']);
  });
});
