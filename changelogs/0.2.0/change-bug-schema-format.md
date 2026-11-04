# Change the format of the BUG schema

## Currently

- A `BUG` analysis uploads a `bug_log` file ([analyses.constants.ts](../../apps/api/src/modules/analyses/analyses.constants.ts)): NDJSON, one error event per line.
  - Fields: `ts`, `level`, `channel`, `type`, `message`, `location`, `method`, `route`, `status` ([leaneo-exceptions-convert.types.ts](../../apps/api/src/modules/add-ons/leaneo-exceptions-convert/leaneo-exceptions-convert.types.ts)). Only `type` is required; lines without it are ignored.
  - `channel` is written by the converter but never read.
- The file is read by `bugLogEvents` ([bug-log-events.ts](../../apps/api/src/modules/files/bug-log-events.ts)), which derives the columns used by the rules and metrics:
  - `error_group` = `type` + `at` + `location`;
  - `is_critical` = `level` in `CRITICAL`, `ALERT`, `EMERGENCY`;
  - `endpoint` = `method` + `route`;
  - `message`, `status`, `ts`.
- Consumers of these columns:
  - rules [error-group.handler.ts](../../apps/api/src/modules/rules/handlers/bug/error-group.handler.ts), [error-endpoint.handler.ts](../../apps/api/src/modules/rules/handlers/bug/error-endpoint.handler.ts);
  - metrics [error-count.handler.ts](../../apps/api/src/modules/metrics/handlers/bug/error-count.handler.ts), [error-occurrences.handler.ts](../../apps/api/src/modules/metrics/handlers/bug/error-occurrences.handler.ts);
  - test lines built by [bug-log.fixtures.ts](../../apps/api/src/modules/files/bug-log.fixtures.ts).
- The only producer is the `LeaneoExceptionsConvert` add-on ([leaneo-exceptions-convert.service.ts](../../apps/api/src/modules/add-ons/leaneo-exceptions-convert/leaneo-exceptions-convert.service.ts)), which maps the Leaneo `exceptions.log`:
  - `type` = exception class, or the normalized message when there is none;
  - `level` = `level_name`;
  - `location` = first `file:line` in the app source;
  - `route` from `context.api` or the "No route found for …" URL;
  - `status` from the exception class, `500` for uncaught exceptions, or the exception code if it is 4xx/5xx.
- Web describes the format in the upload hint `{"type","level","location","route","status"}` ([analyses.constants.ts](../../apps/web/src/modules/analyses/analyses.constants.ts)), which does not list `ts`, `message` or `method`.
- `docs/bug_log.md` is referenced by `bugLogEvents` and `BugEvent` but does not exist; [docs](../../docs) only has `api_metric.md`.

## Acceptance Criteria

- [ ] Add Add-on convert format for exception
- [ ] Change format from currently, to

```ts
{
  "@timestamp": "2026-11-04T10:15:32.481Z",
  "log.level": "error",
  "message": "Payment failed",
  "service.name": "payment-api",
  "trace.id": "4bf92f3577b34da6",
  "http.request.method": "POST",
  "http.response.status_code": 500,
  "error.type": "TimeoutError",
  "error.message": "timeout after 30000ms",
  "error.stack_trace": "..."
}
```

- [ ] Update all code, using new format
- [ ]

## Solutions

- [ ]
- [ ]
- [ ]
