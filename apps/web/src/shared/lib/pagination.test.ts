import { describe, expect, it } from 'vitest';
import { PAGE_SIZE } from './pagination.constants';
import { buildHref, toOffset, toPageCount } from './pagination';

describe('pagination', () => {
  it('maps a 1-based page to an offset', () => {
    expect(toOffset(1)).toBe(0);
    expect(toOffset(3)).toBe(2 * PAGE_SIZE);
  });

  it('counts at least one page', () => {
    expect(toPageCount(0)).toBe(1);
    expect(toPageCount(PAGE_SIZE)).toBe(1);
    expect(toPageCount(PAGE_SIZE + 1)).toBe(2);
  });

  it('builds hrefs and skips empty params', () => {
    expect(buildHref('/x', { page: 2, status: undefined, q: '' })).toBe('/x?page=2');
    expect(buildHref('/x', {})).toBe('/x');
  });
});
