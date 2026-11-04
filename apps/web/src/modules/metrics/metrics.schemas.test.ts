import { describe, expect, it } from 'vitest';
import { metricResultListParamsSchema, updateMetricSchema } from './metrics.schemas';

describe('updateMetricSchema', () => {
  it('trims the description', () => {
    expect(updateMetricSchema.parse({ description: '  P90 duration ', isActive: true, include: [], exclude: [] })).toEqual({
      description: 'P90 duration',
      isActive: true,
      include: [],
      exclude: [],
    });
  });

  it('rejects a blank or too long description', () => {
    expect(updateMetricSchema.safeParse({ description: '   ', isActive: true, include: [], exclude: [] }).success).toBe(false);
    expect(updateMetricSchema.safeParse({ description: 'a'.repeat(256), isActive: true, include: [], exclude: [] }).success).toBe(false);
  });

  it('requires isActive to be a boolean', () => {
    expect(updateMetricSchema.safeParse({ description: 'x', isActive: 'yes', include: [], exclude: [] }).success).toBe(false);
  });

  it('requires include and exclude to be lists of subject uuids', () => {
    expect(updateMetricSchema.safeParse({ description: 'x', isActive: true, include: ['a'], exclude: ['b'] }).success).toBe(true);
    expect(updateMetricSchema.safeParse({ description: 'x', isActive: true, include: 'a', exclude: [] }).success).toBe(false);
    expect(updateMetricSchema.safeParse({ description: 'x', isActive: true }).success).toBe(false);
  });
});

describe('metricResultListParamsSchema', () => {
  it('reads the page and the filters', () => {
    expect(
      metricResultListParamsSchema.parse({ page: '2', metricType: 'ENDPOINT_P95', subjectUuid: '1774ce23-c32c-58aa-9b40-bd08fcfdb938' }),
    ).toEqual({ page: 2, metricType: 'ENDPOINT_P95', subjectUuid: '1774ce23-c32c-58aa-9b40-bd08fcfdb938' });
  });

  it('drops invalid filters', () => {
    expect(metricResultListParamsSchema.parse({ metricType: 'P99', subjectUuid: 'GET /api/cart' })).toEqual({
      page: 1,
      metricType: undefined,
      subjectUuid: undefined,
    });
  });
});
