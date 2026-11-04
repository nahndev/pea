import { ORDERING_DESC_PREFIX, ORDERING_SEPARATOR, SortOrder } from '@tomato/constants';
import { Prisma } from '../../generated/client';

export interface OrderingTerm<F extends string> {
  field: F;
  order: SortOrder;
}

export type Ordering<F extends string> = OrderingTerm<F>[];

type SortValue = string | number | null;

/** `-createdAt,name` → createdAt descending, then name ascending */
export const parseOrdering = (value: string): Ordering<string> =>
  value
    .split(ORDERING_SEPARATOR)
    .map((term) => term.trim())
    .filter(Boolean)
    .map((term) =>
      term.startsWith(ORDERING_DESC_PREFIX)
        ? { field: term.slice(ORDERING_DESC_PREFIX.length), order: SortOrder.DESC }
        : { field: term, order: SortOrder.ASC },
    );

/** Enum values sort in their declaration order */
export const rankOf = (values: readonly string[], value: string) => values.indexOf(value);

/** Leading `ORDER BY` terms, ending with a comma so the default order follows */
export function toSqlOrderBy<F extends string>(ordering: Ordering<F>, columns: Record<F, Prisma.Sql>): Prisma.Sql {
  if (!ordering.length) return Prisma.empty;
  const terms = ordering.map(({ field, order }) => Prisma.sql`${columns[field]} ${Prisma.raw(order === SortOrder.DESC ? 'DESC' : 'ASC')} NULLS LAST`);
  return Prisma.sql`${Prisma.join(terms, ', ')},`;
}

export const toPrismaOrderBy = <F extends string, T>(ordering: Ordering<F>, orderBy: Record<F, (order: SortOrder) => T>): T[] =>
  ordering.map(({ field, order }) => orderBy[field](order));

const compare = (a: SortValue, b: SortValue) => {
  if (a === null || b === null) return 0;
  return typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), undefined, { numeric: true });
};

/** Stable, so the incoming order breaks ties; nulls stay last */
export function sortItems<T, F extends string>(items: T[], valueOf: Record<F, (item: T) => SortValue>, ordering: Ordering<F>): T[] {
  if (!ordering.length) return items;
  return [...items].sort((left, right) => {
    for (const { field, order } of ordering) {
      const a = valueOf[field](left);
      const b = valueOf[field](right);
      if (a === null || b === null) {
        if (a !== b) return a === null ? 1 : -1;
        continue;
      }
      const result = compare(a, b);
      if (result) return order === SortOrder.DESC ? -result : result;
    }
    return 0;
  });
}

export function orderByIds<T extends { id: string }>(ids: string[], items: T[]): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}
