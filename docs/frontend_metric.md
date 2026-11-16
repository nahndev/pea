# frontend_metric format

The **frontend metric log** of a `FRONTEND` analysis (upload field `frontend_metric`, required, max 50 MB).
It is NDJSON: one JSON object per line, one line per page load measured in the browser.

```json
{"@timestamp":"2026-11-16T03:09:36.343Z","name":"page-load","source":"route","route":"/synthese/:id?","previousRoute":null,"status":"settled","startTime":0,"duration":12183,"visibleDuration":3729,"requestCount":58,"requestDuration":29880,"longFrameCount":9,"longFrameDuration":3554,"addedNodes":1825}
```

## Fields

| Field               | Type    | Meaning                                                                    |
| ------------------- | ------- | -------------------------------------------------------------------------- |
| `duration`          | number  | Load duration in ms, until the page settled (or was aborted)               |
| `route`             | string  | Route template of the page, ids as parameters (`/tableau/:id`)             |
| `status`            | string  | `settled`, or `aborted` when the user left before the page settled         |
| `visibleDuration`   | number  | Time in ms until the content was visible                                   |
| `requestCount`      | integer | Requests sent while loading                                                |
| `longFrameDuration` | number  | Time in ms spent in long frames (the page froze) while loading             |
| `name`              | string  | Kind of measure; only `page-load` (or none) is read                        |
| `source`            | string  | What triggered the load (`route`)                                          |
| `previousRoute`     | string  | Route the user came from, `null` on a first load                           |
| `@timestamp`        | string  | When it was logged, ISO 8601; accepted, not used yet                       |
| `startTime`, `requestDuration`, `longFrameCount`, `addedNodes` | | Accepted, not used yet |

- A line needs `duration`; others are ignored. A line that is not valid JSON makes the whole file unreadable.
- Aborted loads count as page loads but their `duration` and `visibleDuration` are ignored, so they don't lower percentiles.
- A **page** (subject `PAGE`) is `[name][source] route - from previousRoute`, e.g. `[page-load][route] /agenda - from /gamme/:id`;
  missing `source` or `previousRoute` are left out. A load without route only counts in the overall metrics.
- Do not put personal data in the file (user, session, urls with ids…): nothing reads it.

## What reads it

`frontendPageLoads` in `apps/api/src/modules/files/frontend-page-loads.ts` exposes `page` (see above), `duration_ms`, `visible_ms`,
`long_frame_ms`, `request_count`, `is_aborted` and `is_from_route` (has a `previousRoute`) to DuckDB.

| Consumer                                                              | Uses                     |
| --------------------------------------------------------------------- | ------------------------ |
| `P50`, `P90`, `P95` metrics, `P50_FAILURE`…`MAX_LATENCY` rules         | `duration_ms`            |
| `PAGE_FROM_ROUTE_P95` (loads from another route), `PAGE_RELOAD_P95` (reloads and first loads) metrics | `page`, `duration_ms`, `is_from_route` |
| `FROM_ROUTE_P50`, `FROM_ROUTE_P90`, `FROM_ROUTE_P95` metrics (loads navigated from another route) | `duration_ms`, `is_from_route` |
| `VISIBLE_P95`, `LONG_FRAME_P95`, `REQUEST_COUNT_P95`, `PAGE_LOAD_COUNT`, `ABORTED_PAGE_LOAD_RATE` metrics | one column each |
| `SLOW_PAGE`, `SLOW_VISIBLE_PAGE`, `LONG_FRAME_PAGE`, `CHATTY_PAGE`, `ABORTED_PAGE` rules | `page` and one column each |

## Producing the file

Turn on the **Leaneo add-on** in the new analysis form to upload a Leaneo Monolog `frontend_performance.log` instead,
see [add-ons.md](add-ons.md).
