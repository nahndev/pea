import { AnalysisSchema } from '@tomato/constants';
import { describe, expect, it } from 'vitest';
import { branchSchemaHref } from './branch-schema-href';

describe('branchSchemaHref', () => {
  it('builds the schema page of a branch with a lowercase slug', () => {
    expect(branchSchemaHref('b-1', AnalysisSchema.QUERY)).toBe('/branches/b-1/query');
  });
});
