import { describe, expect, it } from 'vitest';
import { createConditionSchema, updateConditionSchema } from './conditions.schemas';

const messages = (input: unknown) => {
  const result = updateConditionSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map(({ path, message }) => `${path.join('.')}:${message}`);
};

describe('updateConditionSchema', () => {
  it('coerces the threshold to a number', () => {
    expect(updateConditionSchema.parse({ operator: 'GT', isActive: true, threshold: ' 2500.5 ' })).toEqual({
      operator: 'GT',
      isActive: true,
      threshold: 2500.5,
    });
  });

  it('accepts a threshold of zero', () => {
    expect(updateConditionSchema.parse({ operator: 'GTE', isActive: false, threshold: '0' }).threshold).toBe(0);
  });

  it('rejects an empty, non-numeric or negative threshold', () => {
    expect(messages({ operator: 'GT', isActive: true, threshold: '  ' })).toEqual(['threshold:invalid']);
    expect(messages({ operator: 'GT', isActive: true, threshold: 'abc' })).toEqual(['threshold:invalid']);
    expect(messages({ operator: 'GT', isActive: true, threshold: '-1' })).toEqual(['threshold:invalid']);
  });

  it('requires isActive to be a boolean', () => {
    expect(messages({ operator: 'GT', isActive: 'yes', threshold: '1' })).toHaveLength(1);
  });

  it('rejects an unknown operator', () => {
    expect(messages({ operator: 'EQ', isActive: true, threshold: '1' })).toEqual(['operator:invalid']);
  });
});

describe('createConditionSchema', () => {
  const valid = { qualityGateId: 'g-1', metricId: 'm-1', operator: 'GT', threshold: '1000' };

  it('accepts a gate, a metric, an operator and a threshold', () => {
    expect(createConditionSchema.parse(valid)).toEqual({ ...valid, threshold: 1000 });
  });

  it('requires a gate and a metric', () => {
    expect(createConditionSchema.safeParse({ ...valid, qualityGateId: '' }).success).toBe(false);
    expect(createConditionSchema.safeParse({ ...valid, metricId: '' }).success).toBe(false);
  });

  it('rejects a negative threshold and an unknown operator', () => {
    expect(createConditionSchema.safeParse({ ...valid, threshold: '-5' }).success).toBe(false);
    expect(createConditionSchema.safeParse({ ...valid, operator: 'EQ' }).success).toBe(false);
  });
});
