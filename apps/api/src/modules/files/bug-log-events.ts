export const BUG_LOG_GROUP_COLUMN = 'error_group';
export const BUG_LOG_IS_CRITICAL_COLUMN = 'is_critical';
export const BUG_LOG_ENDPOINT_COLUMN = 'endpoint';
export const BUG_LOG_MESSAGE_COLUMN = 'message';
export const BUG_LOG_TS_COLUMN = 'ts';

/** `log.level` values counted as critical, lower-case */
const CRITICAL_LEVELS = "('critical', 'alert', 'emergency', 'fatal')";
/** Stack frames of dependencies, skipped to locate an error */
const DEPENDENCY_FRAME = '(^|/)(vendor|node_modules)/';

const COLUMNS = `{
  '@timestamp': 'VARCHAR',
  'log.level': 'VARCHAR',
  message: 'VARCHAR',
  'service.name': 'VARCHAR',
  'http.request.method': 'VARCHAR',
  'url.path': 'VARCHAR',
  'http.response.status_code': 'INTEGER',
  'error.type': 'VARCHAR',
  'error.message': 'VARCHAR',
  'error.stack_trace': 'VARCHAR'
}`;

/** Reads a bug_log file (see docs/bug_log.md): one error event per row, lines without `error.type` nor `message` are ignored. */
export const bugLogEvents = (path: string): string => `(
  SELECT
    concat_ws(': ', service, concat_ws(' at ', type, location)) AS ${BUG_LOG_GROUP_COLUMN},
    coalesce(lower(level) IN ${CRITICAL_LEVELS}, false) AS ${BUG_LOG_IS_CRITICAL_COLUMN},
    nullif(concat_ws(' ', method, route), '') AS ${BUG_LOG_ENDPOINT_COLUMN},
    coalesce(error_message, log_message) AS ${BUG_LOG_MESSAGE_COLUMN},
    status,
    ts AS ${BUG_LOG_TS_COLUMN}
  FROM (
    SELECT
      coalesce(nullif(trim("error.type"), ''), nullif(trim(message), '')) AS type,
      nullif(trim(list_filter(
        string_split(coalesce("error.stack_trace", ''), chr(10)),
        lambda frame: trim(frame) <> '' AND NOT regexp_matches(frame, '${DEPENDENCY_FRAME}')
      )[1]), '') AS location,
      nullif(trim("service.name"), '') AS service,
      "log.level" AS level,
      nullif("http.request.method", '') AS method,
      nullif("url.path", '') AS route,
      nullif("error.message", '') AS error_message,
      nullif(message, '') AS log_message,
      "http.response.status_code" AS status,
      epoch_ms(try_cast("@timestamp" AS TIMESTAMPTZ)) AS ts
    FROM read_json('${path.replaceAll("'", "''")}', format = 'newline_delimited', columns = ${COLUMNS})
  )
  WHERE type IS NOT NULL
)`;
