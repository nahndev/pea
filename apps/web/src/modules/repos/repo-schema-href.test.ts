import { AnalysisSchema } from '@tomato/constants';
import { describe, expect, it } from 'vitest';
import { repoSchemaHref } from './repo-schema-href';

describe('repoSchemaHref', () => {
  it('builds the schema page of a repo with a lowercase slug', () => {
    expect(repoSchemaHref('b-1', AnalysisSchema.QUERY)).toBe('/repos/b-1/query');
  });
});
