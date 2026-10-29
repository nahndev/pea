import { API_METRIC_DURATION_COLUMN, DURATION_METRIC_NAME, SECONDS_TO_MS } from './api-metric-durations';

const OTLP_COLUMNS =
  'STRUCT(scopeMetrics STRUCT(metrics STRUCT("name" VARCHAR, histogram STRUCT(dataPoints STRUCT("sum" DOUBLE, attributes STRUCT("key" VARCHAR, "value" STRUCT(stringValue VARCHAR, intValue VARCHAR))[])[]))[])[])[]';

export const API_METRIC_ENDPOINT_COLUMN = 'endpoint';
export const API_METRIC_STATUS_CODE_COLUMN = 'status_code';

const attribute = (key: string, field: 'stringValue' | 'intValue'): string =>
  `list_filter(point.attributes, lambda attribute: attribute."key" = '${key}')[1]."value".${field}`;

export const apiMetricRequests = (path: string): string => `(
  WITH resource_metrics AS (
    SELECT unnest(resourceMetrics) AS resource
    FROM read_json('${path.replaceAll("'", "''")}', format = 'newline_delimited', columns = {resourceMetrics: '${OTLP_COLUMNS}'})
  ),
  scope_metrics AS (SELECT unnest(resource.scopeMetrics) AS scope FROM resource_metrics),
  metrics AS (SELECT unnest(scope.metrics) AS metric FROM scope_metrics),
  data_points AS (
    SELECT unnest(metric.histogram.dataPoints) AS point FROM metrics WHERE metric."name" = '${DURATION_METRIC_NAME}'
  )
  SELECT
    point."sum" * ${SECONDS_TO_MS} AS ${API_METRIC_DURATION_COLUMN},
    concat_ws(' ', ${attribute('http.request.method', 'stringValue')}, ${attribute('http.route', 'stringValue')}) AS ${API_METRIC_ENDPOINT_COLUMN},
    TRY_CAST(${attribute('http.response.status_code', 'intValue')} AS INTEGER) AS ${API_METRIC_STATUS_CODE_COLUMN}
  FROM data_points
)`;
