import { describe, expect, it } from 'vitest';
import { updateMetricSchema } from './metrics.schemas';

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
