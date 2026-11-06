# bug_log format

The **bug log** of a `BUG` analysis (upload field `bug_log`, required, max 50 MB).
It is NDJSON: one JSON object per line, one line per logged error, with flat
[Elastic Common Schema](https://www.elastic.co/guide/en/ecs/current/index.html) keys.

```json
{"@timestamp":"2026-11-04T10:15:32.481Z","log.level":"error","message":"Payment failed","service.name":"payment-api","trace.id":"4bf92f3577b34da6","http.request.method":"POST","url.path":"/api/payments/{id}","http.response.status_code":500,"error.type":"TimeoutError","error.message":"timeout after 30000ms","error.stack_trace":"src/Payment/Gateway.php:40\nsrc/Controller/PaymentController.php:18"}
```

## Fields

| Field                       | Type    | Meaning                                                                   |
| --------------------------- | ------- | ------------------------------------------------------------------------- |
| `error.type`                | string  | Kind of error, e.g. the exception class (`TimeoutError`)                  |
| `message`                   | string  | Log message; the kind of error when `error.type` is missing               |
| `error.message`             | string  | Error message, shown in issue descriptions (else `message`)               |
| `error.stack_trace`         | string  | Frames, one per line, innermost first                                     |
| `log.level`                 | string  | `debug` … `error`, `critical`, `alert`, `emergency`, `fatal`; any case    |
| `service.name`              | string  | Service that logged the error                                             |
| `http.request.method`       | string  | HTTP method of the request                                                |
| `url.path`                  | string  | Route template without query string, ids as `{id}`                        |
| `http.response.status_code` | integer | HTTP response status code                                                 |
| `@timestamp`                | string  | When it was logged, ISO 8601; used to pick the latest message             |
| `trace.id`                  | string  | Distributed trace id; accepted, not used yet                              |

- A line needs `error.type` or `message`; others are ignored. A line that is not valid JSON makes the whole file unreadable.
- Keys are flat (`"log.level": "error"`), not nested objects (`"log": {"level": "error"}`).
- An **error** (subject `ERROR`) is `<error.type> at <location>`, prefixed by `<service.name>: ` when set.
  The location is the first `error.stack_trace` line outside `vendor/` and `node_modules/`; without one the error is just its type.
- An **endpoint** is `<http.request.method> <url.path>` as in [api_metric.md](api_metric.md); without `url.path` the event has none.
- `critical`, `alert`, `emergency` and `fatal` count as critical.
- Do not put personal data in the file (user, ip, form content…): nothing reads it.

## What reads it

`bugLogEvents` in `apps/api/src/modules/files/bug-log-events.ts` exposes `error_group`, `is_critical`, `endpoint`,
`message`, `status` and `ts` to DuckDB.

| Consumer                                                           | Uses                                    |
| ------------------------------------------------------------------ | --------------------------------------- |
| `CRITICAL_ERROR`, `FREQUENT_ERROR` rules                           | `error_group`, `is_critical`, `message` |
| `ERROR_ENDPOINT` rule                                              | `endpoint`, `status`                    |
| `ERROR_COUNT`, `CRITICAL_ERROR_COUNT`, `ERROR_GROUP_COUNT` metrics | all events, `is_critical`, `error_group` |
| `ERROR_OCCURRENCES` metric (50 most frequent errors)               | `error_group`                           |

## Producing the file

Turn on the **Leaneo add-on** in the new analysis form to upload a Leaneo Monolog `exceptions.log` instead,
see [add-ons.md](add-ons.md).
