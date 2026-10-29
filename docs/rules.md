# Analysis rules

A rule inspects one analysis context and creates an issue when its condition is violated.
Rules are rows of the `rules` table (`type`, `description`, `config`) and are seeded by `apps/api/prisma/seed.ts`.

All rules currently apply to `API_METRIC` contexts (OTLP/JSON `http.server.request.duration` logs).
Other context types are skipped.

Configs can be edited from the `Rules` menu of the web app (`PATCH /rules/:id`). Only the fields a rule already has can be changed; changes apply to analyses run afterwards.

## Severity

Every rule has a `severity` (`BLOCKER`, `HIGH`, `MEDIUM`, `LOW`, `INFO`, default `MEDIUM`), editable on `/rules/{id}`
(`PATCH /rules/:id` with `{ "severity": "HIGH" }`). An issue copies the severity of its rule when it is created,
so changing a rule never rewrites past results. Issues can be filtered by severity.

| Severity  | Rules (seed default)                                          |
| --------- | ------------------------------------------------------------- |
| `BLOCKER` | `ERROR_RATE`                                                  |
| `HIGH`    | `P90_FAILURE`, `P95_FAILURE`, `P99_FAILURE`, `ROUTE_ERROR_RATE` |
| `MEDIUM`  | `P50_FAILURE`, `AVG_LATENCY`, `SLOW_REQUEST_RATE`, `SLOW_ROUTE` |
| `LOW`     | `MAX_LATENCY`, `CLIENT_ERROR_RATE`, `SLOW_API`                |

### Issue count metrics

Each severity has a metric (`BLOCKER_ISSUE_COUNT`, `HIGH_ISSUE_COUNT`, `MEDIUM_ISSUE_COUNT`, `LOW_ISSUE_COUNT`,
`INFO_ISSUE_COUNT`, handler `IssueCountHandler`) that counts the issues of a file in the analysis result.
Quality gate conditions can use them like any metric. The `Default` gate fails on more than 0 blocker or high issues.

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
| `SLOW_API`         | any request of the endpoint > `thresholdMs` | `SlowApiHandler`   | `thresholdMs`                | `2000` ms                |

`SLOW_API` ignores `minRequests`: one request over the limit is enough. Issues are ordered by the slowest request.

Issue examples:

- `GET /api/cart P95 1594.7ms exceeds threshold 1500ms`
- `GET /api/cart 5xx error rate 6.1% exceeds threshold 5%`
- `GET /api/cart expected less than 2000ms, current max is 3372.5ms`

## Seed data behaviour

With the default config, the files in `seed/` trigger:

| File                        | Issues                                                                       |
| --------------------------- | ---------------------------------------------------------------------------- |
| `api_metric.healthy.jsonl`  | none                                                                         |
| `api_metric.degraded.jsonl` | P90, average, slow request rate, 5xx rate, 4 slow routes, 1 route 5xx rate   |
| `api_metric.critical.jsonl` | P50–P99, average, max, slow request rate, 6 slow routes, 6 slow APIs             |

## Adding a rule

1. Add the type to `RuleType` in `packages/constants/src/rule-type.constants.ts`.
2. Add it to `RULE_TYPE_LABEL` in `apps/web/src/modules/issues/issues.constants.ts`.
3. Reuse a handler (add an entry to `rules.constants.ts`) or create one implementing `RuleHandler`,
   and register it in `RuleHandlerFactory` and `RulesModule`.
4. Add the default row to `RULES` in `apps/api/prisma/seed.ts` and a section to this file.
5. Map the type to a `<Name>RuleConfig` component in `apps/web/src/modules/rules/components/rule-config/rule-config.factory.tsx`;
   a type without a component shows no config on `/rules/{id}`.
