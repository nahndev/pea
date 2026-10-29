# Analysis rules

A rule inspects one analysis context and creates an issue when its condition is violated.
Rules are rows of the `rules` table (`type`, `description`, `config`) and are seeded by `apps/api/prisma/seed.ts`.

All rules currently apply to `API_METRIC` contexts (OTLP/JSON `http.server.request.duration` logs).
Other context types are skipped.

## Config fields

| Field         | Meaning                                                      |
| ------------- | ------------------------------------------------------------ |
| `thresholdMs` | Duration limit in milliseconds                               |
| `maxPercent`  | Maximum allowed share of requests, in percent                |
| `minRequests` | Per-route rules only: skip routes with fewer requests (default `10`) |

A rule with a missing or non-numeric required field produces no issue.

## Overall latency

One issue per context. Handler: `LatencyHandler`. Config: `thresholdMs`.

| Type           | Violation when                     | Default `thresholdMs` |
| -------------- | ---------------------------------- | --------------------- |
| `P50_FAILURE`  | median duration > threshold        | 500                   |
| `P90_FAILURE`  | 90th percentile > threshold        | 1000                  |
| `P95_FAILURE`  | 95th percentile > threshold        | 2000                  |
| `P99_FAILURE`  | 99th percentile > threshold        | 3000                  |
| `AVG_LATENCY`  | average duration > threshold       | 400                   |
| `MAX_LATENCY`  | slowest request > threshold        | 3000                  |

Issue example: `P90 1367.1ms exceeds threshold 1000ms`

## Request rates

One issue per context. Handler: `RateHandler`.

| Type                | Violation when                                  | Config                       | Default                           |
| ------------------- | ----------------------------------------------- | ---------------------------- | --------------------------------- |
| `SLOW_REQUEST_RATE` | share of requests slower than `thresholdMs` > `maxPercent` | `thresholdMs`, `maxPercent`  | `1000` ms, `5` %                  |
| `ERROR_RATE`        | share of 5xx responses > `maxPercent`           | `maxPercent`                 | `1` %                             |
| `CLIENT_ERROR_RATE` | share of 4xx responses > `maxPercent`           | `maxPercent`                 | `5` %                             |

Issue examples:

- `Slow request rate (>1000ms) 15.0% exceeds threshold 5%`
- `5xx error rate 1.5% exceeds threshold 1%`

## Per-route

One issue per offending endpoint, worst first. An endpoint is `<http.request.method> <http.route>`,
e.g. `GET /api/cart`. Endpoints with fewer than `minRequests` requests are ignored.

| Type               | Violation when                         | Handler                 | Config                       | Default                  |
| ------------------ | -------------------------------------- | ----------------------- | ---------------------------- | ------------------------ |
| `SLOW_ROUTE`       | endpoint P95 > `thresholdMs`           | `SlowRouteHandler`      | `thresholdMs`, `minRequests` | `1500` ms, `10`          |
| `ROUTE_ERROR_RATE` | endpoint 5xx share > `maxPercent`      | `RouteErrorRateHandler` | `maxPercent`, `minRequests`  | `5` %, `10`              |

Issue examples:

- `GET /api/cart P95 1594.7ms exceeds threshold 1500ms`
- `GET /api/cart 5xx error rate 6.1% exceeds threshold 5%`

## Seed data behaviour

With the default config, the files in `seed/` trigger:

| File                        | Issues                                                                       |
| --------------------------- | ---------------------------------------------------------------------------- |
| `api_metric.healthy.jsonl`  | none                                                                         |
| `api_metric.degraded.jsonl` | P90, average, slow request rate, 5xx rate, 4 slow routes, 1 route 5xx rate   |
| `api_metric.critical.jsonl` | P50–P99, average, max, slow request rate, 6 slow routes                      |

## Adding a rule

1. Add the type to `RuleType` in `packages/constants/src/rule-type.constants.ts`.
2. Add it to `RULE_TYPE_LABEL` in `apps/web/src/modules/issues/issues.constants.ts`.
3. Reuse a handler (add an entry to `rules.constants.ts`) or create one implementing `RuleHandler`,
   and register it in `RuleHandlerFactory` and `RulesModule`.
4. Add the default row to `RULES` in `apps/api/prisma/seed.ts` and a section to this file.
