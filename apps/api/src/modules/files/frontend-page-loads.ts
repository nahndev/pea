export const FRONTEND_PAGE_COLUMN = 'page';
export const FRONTEND_DURATION_COLUMN = 'duration_ms';
export const FRONTEND_VISIBLE_COLUMN = 'visible_ms';
export const FRONTEND_LONG_FRAME_COLUMN = 'long_frame_ms';
export const FRONTEND_REQUEST_COUNT_COLUMN = 'request_count';
export const FRONTEND_IS_ABORTED_COLUMN = 'is_aborted';
export const FRONTEND_IS_FROM_ROUTE_COLUMN = 'is_from_route';

const PAGE_LOAD = 'page-load';
const ABORTED = 'aborted';

const COLUMNS = `{
  '@timestamp': 'VARCHAR',
  name: 'VARCHAR',
  source: 'VARCHAR',
  route: 'VARCHAR',
  previousRoute: 'VARCHAR',
  status: 'VARCHAR',
  duration: 'DOUBLE',
  visibleDuration: 'DOUBLE',
  requestCount: 'INTEGER',
  longFrameDuration: 'DOUBLE'
}`;

/**
 * Reads a frontend_metric file (see docs/frontend_metric.md): one page load per row, lines without `duration` are ignored.
 * Durations are null for aborted loads so they don't skew percentiles.
 * The page is `[name][source] route`, without a missing source; null without route.
 */
export const frontendPageLoads = (path: string): string => `(
  SELECT
    '[' || coalesce(nullif(trim(name), ''), '${PAGE_LOAD}') || ']'
      || coalesce('[' || nullif(trim(source), '') || ']', '')
      || ' ' || nullif(trim(route), '') AS ${FRONTEND_PAGE_COLUMN},
    CASE WHEN aborted THEN NULL ELSE duration END AS ${FRONTEND_DURATION_COLUMN},
    CASE WHEN aborted THEN NULL ELSE "visibleDuration" END AS ${FRONTEND_VISIBLE_COLUMN},
    "longFrameDuration" AS ${FRONTEND_LONG_FRAME_COLUMN},
    "requestCount" AS ${FRONTEND_REQUEST_COUNT_COLUMN},
    aborted AS ${FRONTEND_IS_ABORTED_COLUMN},
    nullif(trim("previousRoute"), '') IS NOT NULL AS ${FRONTEND_IS_FROM_ROUTE_COLUMN}
  FROM (
    SELECT *, coalesce(lower(status) = '${ABORTED}', false) AS aborted
    FROM read_json('${path.replaceAll("'", "''")}', format = 'newline_delimited', columns = ${COLUMNS})
  )
  WHERE duration IS NOT NULL AND coalesce(name, '${PAGE_LOAD}') = '${PAGE_LOAD}'
)`;
