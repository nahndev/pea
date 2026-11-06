# Add-ons

Add-ons let an analysis be created from a log in another tool's format. The new analysis form shows a switch
per add-on for the log schemas (`API`, `QUERY`, `BUG`); when it is on, the uploaded file is the add-on's format and
the server converts it before saving it as the analysis log.

- Request: `POST /rest/analyses` with `addOn` (`AddOn` in `@tomato/constants`) next to the log file field
- The converter is picked by add-on and schema in `AddOnsService` (`apps/api/src/modules/add-ons/add-ons.service.ts`)
- Errors: `LOG_FILE_INVALID` when no line could be converted; skipped lines are dropped silently

| Add-on   | Schema           | Upload           | Converter                 |
| -------- | ---------------- | ---------------- | ------------------------- |
| `LEANEO` | `API`, `QUERY`   | `slow_api.log`   | LeaneoSlowApiConvert      |
| `LEANEO` | `BUG`            | `exceptions.log` | LeaneoExceptionsConvert   |

Each converter lives in its own folder, `apps/api/src/modules/add-ons/<slug>/` (service, constants, types, specs).

## LeaneoSlowApiConvert

Converts a `slow_api.log` file to the NDJSON format of the `api_metric` log ([api_metric.md](api_metric.md)),
used by `LEANEO` for the `API` and `QUERY` schemas.

### Input

One JSON record per line:

```json
{"message": "API response time", "context": {"request": {"url": "/api/activite_equipement/gets", "method": "GET"}, "IPs": ["172.71.232.3"], "user": "someone@example.com", "requestTime: ": 1793216768.344719, "responseTime": 1793216775.601549, "elapsedMilleSecond": 7257}, "level": 500, "level_name": "CRITICAL", "datetime": "2026-10-28T19:46:15.601578+00:00"}
```

### Mapping

One line in, one `api_metric` line out.

| api_metric | Source                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------- |
| `ms`       | `context.elapsedMilleSecond`                                                                |
| `method`   | `context.request.method`, upper-cased                                                       |
| `route`    | `context.request.url` without query string, numeric and UUID segments replaced by `{id}`    |
| `ts`       | `context.responseTime` in epoch milliseconds, else `datetime`                               |

Not carried over: `user`, `IPs`, the request time and the free-form fields, so no personal data ends up in the analysis file.
`status` is not written because the slow log has no HTTP status (`level` is the log severity); the status-based rules
(`ERROR_RATE`, `CLIENT_ERROR_RATE`, `ROUTE_ERROR_RATE`) never match on it.

Lines that are blank, not valid JSON, or missing the url, method, duration or a response time are skipped and counted.

### Example

`GET /api/process/generate-pdf-wopi/87472/1/1/1018?timeZone=-60` taking 5378 ms becomes route
`/api/process/generate-pdf-wopi/{id}/{id}/{id}/{id}` and `ms` 5378.

## LeaneoExceptionsConvert

Converts a Monolog `exceptions.log` file to the NDJSON format of the bug log ([bug_log.md](bug_log.md)),
used by `LEANEO` for the `BUG` schema.

### Mapping

One line in, one `bug_log` line out.

| bug_log                     | Source                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| `@timestamp`                | `datetime`, ISO 8601 in UTC (milliseconds)                                                     |
| `log.level`                 | `level_name`, lower-cased                                                                      |
| `message`                   | `message`, normalised, 255 characters                                                          |
| `error.type`                | short class of `context.exception.class`                                                       |
| `error.message`             | `context.exception.message`, normalised, 500 characters                                        |
| `error.stack_trace`         | `context.exception.file` then `trace`, one per line, server path dropped (`src/…`, `vendor/…`) |
| `http.request.method`, `url.path` | `context.api`, or the url of `No route found for "GET https://…"`, ids as `{id}`         |
| `http.response.status_code` | HTTP exceptions by class (`NotFoundHttpException` 404, `TooManyRequestsHttpException` 429…), other uncaught exceptions 500, else an exception `code` between 400 and 599 |

`service.name` and `trace.id` are not written: the Leaneo log has neither.

Normalising drops `[…]` prefixes and replaces emails (`{email}`), uuids and long hex ids (`{id}`), IPv4 (`{ip}`) and
numbers of 3+ digits or with decimals (`{n}`), so one error keeps one type and no personal data is copied.
Nothing else of `context` is carried over (form fields, user, IP, mobile diagnostics).
Lines that are blank, not valid JSON, or have neither an exception class nor a message are skipped and counted.
`channel` is dropped: nothing reads it.

## Adding an add-on

1. Add a key to `AddOn` in `@tomato/constants`.
2. Create `apps/api/src/modules/add-ons/<slug>/` with a service implementing `LogConverter`, provide it in `AddOnsModule`
   and map it per schema in `AddOnsService`.
3. Add the switch and the upload label/hint (`LOG_FILE_FIELD_BY_SCHEMA`) to the new analysis form.
4. Add a section to this file.
