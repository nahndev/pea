import { PAGE_SIZE } from './pagination.constants';

export const toOffset = (page: number) => (page - 1) * PAGE_SIZE;

export const toPageCount = (total: number) => Math.max(1, Math.ceil(total / PAGE_SIZE));

export function buildHref(pathname: string, params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}
