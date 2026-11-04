# Improve sortable table header with cache

## Currently

- [SortableTableHead](../../apps/web/src/shared/components/sortable-table-head.tsx) is a `Link` that cycles a column ascending → descending → default. The chosen `ordering` lives **only in the URL** (`?ordering=-createdAt`), parsed by `orderingParam` ([sort.ts](../../apps/web/src/shared/lib/sort.ts)).
- The ordering is not remembered anywhere else. Leaving a table through the sidebar, a breadcrumb or a detail link and coming back opens it without `?ordering`, so the user's sort is lost and the table falls back to the API default order.
- Used by 9 tables, each building its own `sortHref` with `buildHref` ([pagination.ts](../../apps/web/src/shared/lib/pagination.ts)):
  - Paginated: branches, analyses, issues, metric results, metric history
  - Full lists: metrics, rules, conditions, databases
- Some tables are per scope (analyses per branch + schema, issues per analysis, metrics/rules/conditions per `schema` tab), so one cached ordering per table may not fit every scope.
- Changing the sort refetches the list. Hooks for metrics and issues keep the previous rows with `placeholderData: keepPreviousData`; analyses, branches, conditions, databases and rules do not, so their table flashes `TableSkeleton` on every header click.
- Query cache defaults: `staleTime` 30s, no window-focus refetch ([query-client.ts](../../apps/web/src/shared/lib/query-client.ts)); databases overrides `staleTime: 0`.
- The only client preference persisted today is the theme, in `localStorage` ([theme-toggle.tsx](../../apps/web/src/shared/components/theme-toggle.tsx), [theme.constants.ts](../../apps/web/src/shared/lib/theme.constants.ts)).

## Acceptance Criteria

- [ ] SortableTableHead should cache value
- [ ] After reload, the sort should keep
- [ ] After navigator from other router, should keep

## Solutions

- [x] Cache in a cookie per table (`pea-ordering-<table>`, 1 year), so the server can read it and render the cached order without a flash or a second fetch. Keys are `SortTable` ([sort.constants.ts](../../apps/web/src/shared/lib/sort.constants.ts)); one key per table, shared across scopes (branch, analysis, schema tab) since their sort fields are the same
- [x] `SortableTableHead` takes a required `cacheKey` and saves the next ordering on click with `saveOrdering`; returning to the default order deletes the cookie, so the default is cached too
- [x] List pages wrap their search params with `withCachedOrdering` ([sort-cache.ts](../../apps/web/src/shared/lib/sort-cache.ts)): a URL `?ordering` wins, otherwise the cookie is used. The value still goes through the table's `orderingParam`, so stale or unknown fields are dropped
- [x] Reload keeps the order from the URL; sidebar, breadcrumb, schema tab and detail links (no `?ordering`) restore it from the cookie
