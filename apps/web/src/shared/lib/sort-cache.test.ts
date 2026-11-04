import { describe, expect, it, vi } from 'vitest';
import { withCachedOrdering } from './sort-cache';
import { SortTable } from './sort.constants';

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (name === 'pea-ordering-rules' ? { name, value: '-severity' } : undefined),
  }),
}));

describe('withCachedOrdering', () => {
  it('uses the saved ordering when the URL has none', async () => {
    await expect(withCachedOrdering(SortTable.RULES, { schema: 'database' })).resolves.toEqual({ schema: 'database', ordering: '-severity' });
  });

  it('keeps the URL ordering', async () => {
    await expect(withCachedOrdering(SortTable.RULES, { ordering: 'name' })).resolves.toEqual({ ordering: 'name' });
  });

  it('leaves params unchanged when nothing is saved', async () => {
    await expect(withCachedOrdering(SortTable.BRANCHES, { page: '2' })).resolves.toEqual({ page: '2' });
  });
});
