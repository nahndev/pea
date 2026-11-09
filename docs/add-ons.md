# Add-ons

Add-ons let an analysis be created from a log in another tool's format. They work like editor extensions: each
add-on is a folder that declares what it contributes in a manifest, and the API discovers the folders at startup.

```
apps/api/src/modules/add-ons/plugins/<id>/
  index.ts             default export: AddOnPlugin = { manifest, converters }
  <id>.manifest.ts     AddOnManifest (@tomato/types): id, version, label, description, converters[]
  *.converter.ts       one LineConverter per manifest converter
```

- `AddOnRegistry` loads every `plugins/*/index` and checks each manifest: unique id, at most one converter per schema,
  an implementation for every declared converter. A broken add-on stops the API at startup.
- `GET /rest/add-ons` returns the manifests. The new analysis form shows one switch per add-on that converts the
  selected schema, with the converter `input` and `hint`; nothing in the web app names an add-on.
- `POST /rest/analyses` takes `addOn` (an add-on id) next to the log file. Unknown id or schema not converted:
  `ADD_ON_NOT_FOUND`. No line converted: `LOG_FILE_INVALID`.

## Converter contract

```ts
type LineConverter = (line: string) => object | null;
```

One input line in, one output record out, `null` (or a thrown error) to skip the line. The host
(`convert-lines.ts`) reads the upload line by line, skips blank lines, writes each record as one NDJSON line and
counts converted and skipped lines. Uploads are written to a temporary folder by multer and streamed from disk to
storage, so a 50 MB log is never held in memory; the temporary files are removed when the request ends.

## Leaneo

| Converter    | Schemas        | Upload           | Output                       |
| ------------ | -------------- | ---------------- | ---------------------------- |
| `slow-api`   | `API`, `QUERY` | `slow_api.log`   | [api_metric](api_metric.md) |
| `exceptions` | `BUG`          | `exceptions.log` | [bug_log](bug_log.md)       |

### `slow-api`

Converts a `slow_api.log` file to the NDJSON format of the `api_metric` log ([api_metric.md](api_metric.md)),
for the `API` and `QUERY` schemas.

#### Input

One JSON record per line:

```json
{"message": "API response time", "context": {"request": {"url": "/api/activite_equipement/gets", "method": "GET"}, "IPs": ["172.71.232.3"], "user": "someone@example.com", "requestTime: ": 1793216768.344719, "responseTime": 1793216775.601549, "elapsedMilleSecond": 7257}, "level": 500, "level_name": "CRITICAL", "datetime": "2026-10-28T19:46:15.601578+00:00"}
```

#### Mapping

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

#### Example

`GET /api/process/generate-pdf-wopi/87472/1/1/1018?timeZone=-60` taking 5378 ms becomes route
`/api/process/generate-pdf-wopi/{id}/{id}/{id}/{id}` and `ms` 5378.

### `exceptions`

Converts a Monolog `exceptions.log` file to the NDJSON format of the bug log ([bug_log.md](bug_log.md)),
for the `BUG` schema.

#### Mapping

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

1. Create `apps/api/src/modules/add-ons/plugins/<id>/` with a manifest, one `LineConverter` per converter and an
   `index.ts` default-exporting the `AddOnPlugin`.
2. Add specs for the converters (`convertWith` in `add-ons.testing.ts` runs one the way uploads are converted).
3. Add a section to this file.

No other module, constant or web file changes.
