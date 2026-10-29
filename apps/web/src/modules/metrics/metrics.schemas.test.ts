import { describe, expect, it } from 'vitest';
import { updateMetricSchema } from './metrics.schemas';

describe('updateMetricSchema', () => {
  it('trims the description', () => {
    expect(updateMetricSchema.parse({ description: '  P90 duration ', isActive: true })).toEqual({
      description: 'P90 duration',
      isActive: true,
    });
  });

  it('rejects a blank or too long description', () => {
    expect(updateMetricSchema.safeParse({ description: '   ', isActive: true }).success).toBe(false);
    expect(updateMetricSchema.safeParse({ description: 'a'.repeat(256), isActive: true }).success).toBe(false);
  });

  it('requires isActive to be a boolean', () => {
    expect(updateMetricSchema.safeParse({ description: 'x', isActive: 'yes' }).success).toBe(false);
  });
});
