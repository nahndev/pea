import { describe, expect, it } from 'vitest';
import { issueListParamsSchema } from './issues.schemas';

describe('issueListParamsSchema', () => {
  it('defaults to the first page without filters', () => {
    expect(issueListParamsSchema.parse({})).toEqual({ page: 1, status: undefined, ruleType: undefined });
  });

  it('accepts valid filters', () => {
    expect(issueListParamsSchema.parse({ page: '3', status: 'OPEN', severity: 'HIGH', ruleType: 'P90_FAILURE' })).toEqual({
      page: 3,
      status: 'OPEN',
      severity: 'HIGH',
      ruleType: 'P90_FAILURE',
    });
  });

  it('drops invalid values instead of throwing', () => {
    expect(issueListParamsSchema.parse({ page: '-2', status: 'NOPE', severity: 'NOPE', ruleType: ['a', 'b'] })).toEqual({
      page: 1,
      status: undefined,
      severity: undefined,
      ruleType: undefined,
    });
  });
});
