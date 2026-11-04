# bug_log format

The **bug log** of a `BUG` analysis (upload field `bug_log`, required, max 50 MB).
It is NDJSON: one JSON object per line, one line per logged error.

```json
{"ts":1793690876869,"level":"CRITICAL","channel":"request","type":"DeadlockException","message":"Deadlock detected","location":"src/Repository/ProcessRepository.php:120","method":"POST","route":"/api/process/{id}","status":500}
```

## Fields

| Field      | Type    | Required | Meaning                                                                   |
| ---------- | ------- | -------- | ------------------------------------------------------------------------- |
| `type`     | string  | yes      | Kind of error: exception short class (`NotFoundHttpException`) or normalised message |
| `level`    | string  | no       | Monolog level (`ERROR`, `CRITICAL`, `ALERT`, `EMERGENCY`…), any case       |
| `message`  | string  | no       | Error message without ids or personal data; shown in issue descriptions   |
| `location` | string  | no       | Where it was raised in the application, `file:line`                       |
| `method`   | string  | no       | HTTP method of the request                                                |
| `route`    | string  | no       | Route template without query string, ids as `{id}`                        |
| `status`   | integer | no       | HTTP response status code                                                 |
| `channel`  | string  | no       | Log channel; stored, not used yet                                         |
| `ts`       | integer | no       | When it was logged, Unix epoch in milliseconds (UTC); used to pick the latest message |

- An **error** (subject `ERROR`) is `<type> at <location>` (`NotFoundHttpException at src/Controller/A.php:29`),
  or just `<type>` without location. It is what error rules and metrics group by.
- An **endpoint** is `<method> <route>` as in [api_metric.md](api_metric.md); without `route` the event has none.
- `CRITICAL`, `ALERT` and `EMERGENCY` count as critical.
- A line without `type` is ignored; a line that is not valid JSON makes the whole file unreadable.
- Do not put personal data in the file (user, ip, form content…): nothing reads it.

## What reads it

`bugLogEvents` in `apps/api/src/modules/files/bug-log-events.ts` exposes `error_group`, `is_critical`, `endpoint`,
`message`, `status` and `ts` to DuckDB.

| Consumer                                                    | Uses                         |
| ----------------------------------------------------------- | ---------------------------- |
| `CRITICAL_ERROR`, `FREQUENT_ERROR` rules                    | `error_group`, `is_critical`, `message` |
| `ERROR_ENDPOINT` rule                                       | `endpoint`, `status`         |
| `ERROR_COUNT`, `CRITICAL_ERROR_COUNT`, `ERROR_GROUP_COUNT` metrics | all events, `is_critical`, `error_group` |
| `ERROR_OCCURRENCES` metric (50 most frequent errors)        | `error_group`                |

## Producing the file

`LeaneoExceptionsConvert` add-on (`/add-ons/leaneo-exceptions-convert`) converts a Monolog `exceptions.log`,
see [add-ons.md](add-ons.md).
