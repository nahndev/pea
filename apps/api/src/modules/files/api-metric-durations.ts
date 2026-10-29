const DURATION_METRIC_NAME = 'http.server.request.duration';
const SECONDS_TO_MS = 1000;

const OTLP_COLUMNS =
  'STRUCT(scopeMetrics STRUCT(metrics STRUCT("name" VARCHAR, histogram STRUCT(dataPoints STRUCT("sum" DOUBLE)[]))[])[])[]';

export const API_METRIC_DURATION_COLUMN = 'duration_ms';

export const apiMetricDurations = (path: string): string => `(
  WITH resource_metrics AS (
    SELECT unnest(resourceMetrics) AS resource
    FROM read_json('${path.replaceAll("'", "''")}', format = 'newline_delimited', columns = {resourceMetrics: '${OTLP_COLUMNS}'})
  ),
  scope_metrics AS (SELECT unnest(resource.scopeMetrics) AS scope FROM resource_metrics),
  metrics AS (SELECT unnest(scope.metrics) AS metric FROM scope_metrics),
  data_points AS (
    SELECT unnest(metric.histogram.dataPoints) AS point FROM metrics WHERE metric."name" = '${DURATION_METRIC_NAME}'
  )
  SELECT point."sum" * ${SECONDS_TO_MS} AS ${API_METRIC_DURATION_COLUMN} FROM data_points
)`;
