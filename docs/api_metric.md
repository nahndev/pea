# api_metric format

The **API metric log** of an analysis (upload field `api_metric`, required, max 50 MB).
It is NDJSON: one JSON object per line, one line per HTTP request.

```json
{"ts":1793181603523,"method":"GET","route":"/api/products","status":200,"ms":3522.9}
```

## Fields

| Field    | Type    | Required | Meaning                                                              |
| -------- | ------- | -------- | -------------------------------------------------------------------- |
| `ms`     | number  | yes      | Duration of the request in **milliseconds**                          |
| `method` | string  | no       | HTTP method, upper-case (`GET`, `POST`, ...)                         |
| `route`  | string  | no       | Route template without query string, ids as `{id}` (`/api/orders/{id}`) |
| `status` | integer | no       | HTTP response status code                                            |
| `ts`     | integer | no       | When the request ended, Unix epoch in milliseconds (UTC)             |

- An **endpoint** is `<method> <route>` (`GET /api/cart`). It is what per-endpoint rules and metrics group by.
  Without `route` the endpoint is just the method, without both it is empty.
- A line without `ms` is ignored. Other fields it may carry are ignored too.
- `ts` is stored for time based analysis but not used yet.
- Without `status` the status based rules (`ERROR_RATE`, `CLIENT_ERROR_RATE`, `ROUTE_ERROR_RATE`) never match.
- A line that is not valid JSON makes the whole file unreadable.
- Do not put personal data in the file (user, ip, ...): nothing reads it.

## What reads it

`apiMetricRequests` in `apps/api/src/modules/files/api-metric-requests.ts` is the only reader. It exposes the columns
`duration_ms`, `endpoint` and `status_code` to DuckDB, so every rule and metric handler works on the same view:

| Consumer                                                   | Uses                          |
| ---------------------------------------------------------- | ----------------------------- |
| Latency rules, `P50`/`P90`/`P95` metrics                   | `duration_ms`                 |
| `SLOW_REQUEST_RATE`, `ERROR_RATE`, `CLIENT_ERROR_RATE`     | `duration_ms`, `status_code`  |
| `SLOW_ROUTE`, `SLOW_API`, `ENDPOINT_P95`                   | `endpoint`, `duration_ms`     |
| `ROUTE_ERROR_RATE`                                         | `endpoint`, `status_code`     |

## Producing the file

- `LeaneoSlowApiConvert` add-on (`/add-ons/leaneo-slow-api-convert`) converts a `slow_api.log`, see [add-ons.md](add-ons.md).
- Sample files: `seed/api_metric.healthy.jsonl`, `seed/api_metric.degraded.jsonl`, `seed/api_metric.critical.jsonl`
  (200 requests each, see "Seed data behaviour" in [rules.md](rules.md)).

## Why this format

The log used to be OTLP/JSON (`http.server.request.duration` histograms, about 770 bytes per request, one data point
per line). Only the duration, the method, the route and the status were read, so it was replaced by this flat format:
about 85 bytes per request (9 times smaller), about 8 times faster to query with DuckDB (200k requests: 277 ms
against 36 ms), no seconds to milliseconds conversion, and a plain reader without `unnest`.
The same data gives the same results (checked on the seed files).

Files in the old OTLP format are no longer readable; convert them or upload a new log.
