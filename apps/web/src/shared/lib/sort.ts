import { ORDERING_DESC_PREFIX, ORDERING_SEPARATOR, SortOrder } from '@tomato/constants';
import { z } from 'zod';

interface OrderingTerm {
  field: string;
  order: SortOrder;
}

const toTerms = (ordering = ''): OrderingTerm[] =>
  ordering
    .split(ORDERING_SEPARATOR)
    .map((term) => term.trim())
    .filter(Boolean)
    .map((term) =>
      term.startsWith(ORDERING_DESC_PREFIX)
        ? { field: term.slice(ORDERING_DESC_PREFIX.length), order: SortOrder.DESC }
        : { field: term, order: SortOrder.ASC },
    );

const toOrdering = (terms: OrderingTerm[]) =>
  terms.map(({ field, order }) => (order === SortOrder.DESC ? `${ORDERING_DESC_PREFIX}${field}` : field)).join(ORDERING_SEPARATOR) || undefined;

/** JSON:API style `ordering`, e.g. `-createdAt,name`, keeping only known fields once each */
export const orderingParam = (fields: Record<string, string>) => {
  const allowed: readonly string[] = Object.values(fields);
  return z
    .string()
    .optional()
    .catch(undefined)
    .transform((value) => {
      const seen = new Set<string>();
      return toOrdering(toTerms(value).filter(({ field }) => allowed.includes(field) && !seen.has(field) && seen.add(field)));
    })
    .optional();
};

export const orderOf = (ordering: string | undefined, field: string) => toTerms(ordering).find((term) => term.field === field)?.order;

/** Sorts by one column, cycling ascending, descending, then the default order */
export function nextOrdering(ordering: string | undefined, field: string): string | undefined {
  const [primary] = toTerms(ordering);
  if (primary?.field !== field) return field;
  return primary.order === SortOrder.ASC ? `${ORDERING_DESC_PREFIX}${field}` : undefined;
}
