# Simplify analysis

## Currently

- An analysis is spread over four tables in [schema.prisma](../../apps/api/prisma/schema.prisma): `Analysis` (branch, merge request), `AnalysisContext` (one row per analyzed file), `AnalysisResult` (status, `issueCount`, a new row per run) and `MetricResult`/`Issue` hanging off both a context and a result.
- `Analysis` → `AnalysisResult` is one-to-many, and `MetricResult`/`Issue` reference `AnalysisContext` and `AnalysisResult` at the same time, so reading or writing one analysis needs several joins and keeping two foreign keys consistent.
- The code is in [analyses](../../apps/api/src/modules/analyses) (api) and [analyses](../../apps/web/src/modules/analyses) (web); the extra layers make the service, repository, DTOs and the analysis pages heavier than what users actually see.

## Acceptance Criteria

- [x] No `AnalysisContext`: an analysis has a single log file (`file`, `path`)
- [x] `MetricResult` and `Issue` hang off `AnalysisResult` only
- [x] Upload takes one required `api_metric` file; the unused `query` log is gone
- [x] Existing data is migrated (analyses without an `API_METRIC` file are removed)

## Solutions

- [x] Add `file`/`path` to `Analysis`, drop `AnalysisContext`, `analysisContextId` and `AnalysisContextType`; migration `drop_analysis_contexts`
- [x] Rule and metric handlers take the `Analysis`; metric results are unique per result, metric and `subject`
- [x] `POST /analyses` uses `FileInterceptor`, error `LOG_FILE_REQUIRED` when the file is missing
- [x] Drop the file column from issues and metric results in the web, show the file on the analysis header
- [x] Update docs ([rules.md](../../docs/rules.md), [api_metric.md](../../docs/api_metric.md))
