import { SortOrder } from '@tomato/constants';
import { describe, expect, it } from 'vitest';
import { nextOrdering, orderOf, orderingParam, saveOrdering } from './sort';
import { SortTable } from './sort.constants';

const Field = { NAME: 'name', SIZE: 'size' } as const;

describe('orderingParam', () => {
  const schema = orderingParam(Field);

  it('keeps a valid ordering', () => {
    expect(schema.parse('-size,name')).toBe('-size,name');
  });

  it('drops unknown and repeated fields instead of throwing', () => {
    expect(schema.parse('id,-size,size')).toBe('-size');
    expect(schema.parse('id')).toBeUndefined();
    expect(schema.parse(['name', 'size'])).toBeUndefined();
    expect(schema.parse(undefined)).toBeUndefined();
  });
});

describe('orderOf', () => {
  it('reads the order of any term', () => {
    expect(orderOf('-size,name', 'size')).toBe(SortOrder.DESC);
    expect(orderOf('-size,name', 'name')).toBe(SortOrder.ASC);
    expect(orderOf(undefined, 'name')).toBeUndefined();
  });
});

describe('nextOrdering', () => {
  it('starts a new column ascending', () => {
    expect(nextOrdering('-size', 'name')).toBe('name');
    expect(nextOrdering(undefined, 'name')).toBe('name');
  });

  it('cycles ascending, descending, then the default order', () => {
    expect(nextOrdering('name', 'name')).toBe('-name');
    expect(nextOrdering('-name,size', 'name')).toBeUndefined();
  });
});

describe('saveOrdering', () => {
  it('stores the ordering per table and clears it on the default order', () => {
    saveOrdering(SortTable.ISSUES, '-count,severity');
    expect(document.cookie).toContain('pea-ordering-issues=-count%2Cseverity');

    saveOrdering(SortTable.ISSUES, undefined);
    expect(document.cookie).not.toContain('pea-ordering-issues');
  });
});
