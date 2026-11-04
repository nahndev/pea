# Add-ons

Add-ons are standalone tools that support the analysis workflow. They are listed at `/add-ons`
(header menu **Add-ons**); each one has its own page under `/add-ons/<slug>`.

Each add-on lives in its own folder, on both sides:

```
apps/api/src/modules/add-ons/<slug>/   controller, service, constants, types, specs
apps/web/src/modules/add-ons/<slug>/   components, hooks, services, schemas
```

`AddOnsModule` (api) registers the controllers and providers; `ADD_ONS` in
`apps/web/src/modules/add-ons/add-ons.constants.ts` lists the tools shown in the menu.

## LeaneoSlowApiConvert

Converts a `slow_api.log` file to the NDJSON format of the `api_metric` log ([api_metric.md](api_metric.md)),
so it can be uploaded as the **API metric log** of a new analysis.

- Page: `/add-ons/leaneo-slow-api-convert`
- Endpoint: `POST /rest/add-ons/leaneo-slow-api-convert` (multipart, field `file`, max 50 MB)
- Response: `application/x-ndjson` attachment `api_metric.log`; the number of converted and skipped
  lines is in the `x-converted-count` and `x-skipped-count` headers (`AddOnHeader` in `@tomato/constants`)
- Errors: `LOG_FILE_REQUIRED` (no file), `LOG_FILE_INVALID` (no line could be converted)

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
so it can be uploaded as the **Bug log** of a new `BUG` analysis.

- Page: `/add-ons/leaneo-exceptions-convert`
- Endpoint: `POST /rest/add-ons/leaneo-exceptions-convert` (multipart, field `file`, max 50 MB)
- Response: `application/x-ndjson` attachment `bug_log.log`, counts in the same headers as LeaneoSlowApiConvert
- Errors: `LOG_FILE_REQUIRED` (no file), `LOG_FILE_INVALID` (no line could be converted)

### Mapping

One line in, one `bug_log` line out.

| bug_log    | Source                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| `type`     | short class of `context.exception.class`, else `message` normalised                                     |
| `message`  | `context.exception.message`, else `message`, normalised, 500 characters                                 |
| `location` | first frame of `context.exception.file` / `trace` under `/src/`, from `src/` (`src/Controller/A.php:12`) |
| `route`    | `context.api`, or the url of `No route found for "GET https://…"` (then `method` too), ids as `{id}`    |
| `status`   | HTTP exceptions by class (`NotFoundHttpException` 404, `TooManyRequestsHttpException` 429…), other uncaught exceptions 500, else an exception `code` between 400 and 599 |
| `level`    | `level_name`, upper-cased                                                                               |
| `channel`  | `channel`                                                                                               |
| `ts`       | `datetime` in epoch milliseconds                                                                        |

Normalising drops `[…]` prefixes and replaces emails (`{email}`), uuids and long hex ids (`{id}`), IPv4 (`{ip}`) and
numbers of 3+ digits or with decimals (`{n}`), so one error keeps one type and no personal data is copied.
Nothing else of `context` is carried over (form fields, user, IP, mobile diagnostics).
Lines that are blank, not valid JSON, or have neither an exception class nor a message are skipped and counted.

## Adding an add-on

1. Create `apps/api/src/modules/add-ons/<slug>/` and register its controller and providers in `AddOnsModule`.
2. Create `apps/web/src/modules/add-ons/<slug>/`, export what the pages need from the module `index.ts`.
3. Add the route under `apps/web/src/app/add-ons/<slug>/page.tsx` and an entry to `ADD_ONS`.
4. Add a section to this file.
