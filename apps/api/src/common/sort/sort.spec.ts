import { SortOrder } from '@tomato/constants';
import { Prisma } from '../../generated/client';
import { orderByIds, parseOrdering, rankOf, sortItems, toPrismaOrderBy, toSqlOrderBy } from './sort';

describe('parseOrdering', () => {
  it('reads a JSON:API ordering, a leading dash meaning descending', () => {
    expect(parseOrdering('-createdAt, name')).toEqual([
      { field: 'createdAt', order: SortOrder.DESC },
      { field: 'name', order: SortOrder.ASC },
    ]);
  });

  it('skips empty terms', () => {
    expect(parseOrdering('')).toEqual([]);
    expect(parseOrdering('name,,')).toEqual([{ field: 'name', order: SortOrder.ASC }]);
  });
});

describe('sortItems', () => {
  type Item = { id: string; name: string; size: number; tag: string | null };
  const items: Item[] = [
    { id: 'a', name: 'item 10', size: 2, tag: null },
    { id: 'b', name: 'item 2', size: 1, tag: 'x' },
    { id: 'c', name: 'Item 1', size: 2, tag: 'y' },
  ];
  const valueOf = { name: (item: Item) => item.name, size: (item: Item) => item.size, tag: (item: Item) => item.tag };

  it('keeps the incoming order without an ordering', () => {
    expect(sortItems(items, valueOf, [])).toBe(items);
  });

  it('sorts text naturally and case-insensitively', () => {
    expect(sortItems(items, valueOf, [{ field: 'name', order: SortOrder.ASC }]).map(({ id }) => id)).toEqual(['c', 'b', 'a']);
  });

  it('breaks ties with the next term, then the incoming order', () => {
    expect(sortItems(items, valueOf, [{ field: 'size', order: SortOrder.DESC }]).map(({ id }) => id)).toEqual(['a', 'c', 'b']);
    expect(
      sortItems(items, valueOf, [
        { field: 'size', order: SortOrder.DESC },
        { field: 'name', order: SortOrder.ASC },
      ]).map(({ id }) => id),
    ).toEqual(['c', 'a', 'b']);
  });

  it('keeps nulls last in both directions', () => {
    expect(sortItems(items, valueOf, [{ field: 'tag', order: SortOrder.ASC }]).map(({ id }) => id)).toEqual(['b', 'c', 'a']);
    expect(sortItems(items, valueOf, [{ field: 'tag', order: SortOrder.DESC }]).map(({ id }) => id)).toEqual(['c', 'b', 'a']);
  });
});

describe('toSqlOrderBy', () => {
  const columns = { name: Prisma.sql`b.name`, size: Prisma.sql`COUNT(a.id)` };

  it('adds nothing without an ordering', () => {
    expect(toSqlOrderBy([], columns).sql).toBe('');
  });

  it('maps each term to its column with a direction', () => {
    expect(
      toSqlOrderBy(
        [
          { field: 'size', order: SortOrder.DESC },
          { field: 'name', order: SortOrder.ASC },
        ],
        columns,
      ).sql,
    ).toBe('COUNT(a.id) DESC NULLS LAST, b.name ASC NULLS LAST,');
  });
});

describe('toPrismaOrderBy', () => {
  it('maps each term in order', () => {
    const orderBy: Record<string, (order: SortOrder) => Record<string, SortOrder>> = { name: (order) => ({ name: order }), size: (order) => ({ size: order }) };
    expect(
      toPrismaOrderBy(
        [
          { field: 'size', order: SortOrder.DESC },
          { field: 'name', order: SortOrder.ASC },
        ],
        orderBy,
      ),
    ).toEqual([{ size: 'desc' }, { name: 'asc' }]);
  });
});

describe('rankOf', () => {
  it('ranks a value by its declaration order', () => {
    expect(rankOf(['HIGH', 'LOW'], 'LOW')).toBe(1);
  });
});

describe('orderByIds', () => {
  it('follows the id order and skips missing items', () => {
    expect(orderByIds(['b', 'x', 'a'], [{ id: 'a' }, { id: 'b' }])).toEqual([{ id: 'b' }, { id: 'a' }]);
  });
});
