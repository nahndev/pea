import { cookies } from 'next/headers';
import { orderingCookieName } from './sort';
import type { SortTable } from './sort.constants';

type SearchParams = Record<string, string | string[] | undefined>;

/** Falls back to the ordering saved by `SortableTableHead` when the URL has none */
export async function withCachedOrdering(table: SortTable, searchParams: SearchParams): Promise<SearchParams> {
  if (searchParams.ordering !== undefined) return searchParams;
  const cached = (await cookies()).get(orderingCookieName(table))?.value;
  return cached ? { ...searchParams, ordering: cached } : searchParams;
}
