export const BUG_LOG_GROUP_COLUMN = 'error_group';
export const BUG_LOG_IS_CRITICAL_COLUMN = 'is_critical';
export const BUG_LOG_ENDPOINT_COLUMN = 'endpoint';
export const BUG_LOG_MESSAGE_COLUMN = 'message';
export const BUG_LOG_TS_COLUMN = 'ts';

/** Monolog levels counted as critical */
const CRITICAL_LEVELS = "('CRITICAL', 'ALERT', 'EMERGENCY')";

const COLUMNS =
  "{ts: 'BIGINT', level: 'VARCHAR', type: 'VARCHAR', message: 'VARCHAR', location: 'VARCHAR', method: 'VARCHAR', route: 'VARCHAR', status: 'INTEGER'}";

/** Reads a bug_log file (see docs/bug_log.md): one error event per row, lines without `type` are ignored. */
export const bugLogEvents = (path: string): string => `(
  SELECT
    concat_ws(' at ', type, nullif(location, '')) AS ${BUG_LOG_GROUP_COLUMN},
    coalesce(upper(level) IN ${CRITICAL_LEVELS}, false) AS ${BUG_LOG_IS_CRITICAL_COLUMN},
    nullif(concat_ws(' ', method, route), '') AS ${BUG_LOG_ENDPOINT_COLUMN},
    message AS ${BUG_LOG_MESSAGE_COLUMN},
    status,
    ts AS ${BUG_LOG_TS_COLUMN}
  FROM read_json('${path.replaceAll("'", "''")}', format = 'newline_delimited', columns = ${COLUMNS})
  WHERE nullif(type, '') IS NOT NULL
)`;
