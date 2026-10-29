export const API_METRIC_DURATION_COLUMN = 'duration_ms';
export const API_METRIC_ENDPOINT_COLUMN = 'endpoint';
export const API_METRIC_STATUS_CODE_COLUMN = 'status_code';

const COLUMNS = "{method: 'VARCHAR', route: 'VARCHAR', status: 'INTEGER', ms: 'DOUBLE'}";

/** Reads an api_metric file (see docs/api_metric.md): one request per row, lines without `ms` are ignored. */
export const apiMetricRequests = (path: string): string => `(
  SELECT
    ms AS ${API_METRIC_DURATION_COLUMN},
    concat_ws(' ', method, route) AS ${API_METRIC_ENDPOINT_COLUMN},
    status AS ${API_METRIC_STATUS_CODE_COLUMN}
  FROM read_json('${path.replaceAll("'", "''")}', format = 'newline_delimited', columns = ${COLUMNS})
  WHERE ms IS NOT NULL
)`;
