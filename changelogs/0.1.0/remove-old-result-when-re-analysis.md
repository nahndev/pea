# Remove old result when re-analysis

## Currently

- "Re-analyse" ([analysis-header.tsx](../../apps/web/src/modules/analyses/components/analysis-header.tsx)) calls `POST /analyses/:analysisId/results` → `AnalysisResultService.rerun` ([analysis-result.service.ts](../../apps/api/src/modules/analysis-result/analysis-result.service.ts)), which creates a **new** `AnalysisResult` and runs `execute()` in the background.
- `execute()` only inserts: `Issue` (`IssuesService.createMany`), `MetricResult` (`MetricsService.measure`), `MetricEvaluation` (`MetricConditionsService.evaluate`), all tied to the new `analysisResultId`. Nothing deletes the previous results, so every re-analysis keeps adding a full set of rows.
- The API only reads the latest result (`AnalysisResultRepository.findLatestByAnalysis`, not filtered by `status`), so old results are hidden but stay in the DB. While a re-analysis is running, or after it `FAILED`, the issues/metrics lists show the new (empty/partial) result instead of the last `COMPLETED` one.
- Relations in [schema.prisma](../../apps/api/prisma/schema.prisma): `Issue`, `MetricResult` → `AnalysisResult` and `MetricEvaluation` → `MetricResult` are `onDelete: Cascade`, so deleting an `AnalysisResult` removes its children. `IssueSubject` (status per rule + subject) and `Subject` are not linked to `AnalysisResult` and are not affected.
- Old results are still used:
  - Aggregate limits on metric conditions use the previous `COMPLETED` results of the same analysis as baseline (`MetricResultsRepository.findPassedHistory`, called from `MetricConditionsService.evaluate`).
  - The issue "Count" on the detail page counts every `Issue` with the same `(ruleId, subjectUuid)` across all analyses (`IssuesRepository.countBySubject`).
- Open points: delete before or after the new run (only when it `COMPLETED`?); keep the last N results or only the latest; what happens to the aggregate baseline and the issue count once history is removed.

## Acceptance Criteria

- [x] When click on `re-analysis`, remove all results by previous analysis
- [x] Remove `Issue`, remove `MetricResult`, `MetricEvaluation`

## Solutions

- [x] `AnalysisResultService.rerun` calls `AnalysisResultRepository.deleteOlderThan(result)` once the new run is `COMPLETED`: deletes every `AnalysisResult` of the analysis created before it; `Issue`, `MetricResult` and `MetricEvaluation` go through the DB cascade.
- [x] A `FAILED` re-analysis deletes nothing, so the previous results are kept.
- [x] Deleting after `MetricConditionsService.evaluate` keeps the previous result as the aggregate baseline of the new run; the baseline is therefore the last run only, not the whole history.
- [x] `IssueSubject` (status) is untouched; the issue "Count" no longer includes issues of deleted results.
- [x] Only results older than the new one are deleted, so a concurrent run is not removed. The first run (`run`) deletes nothing.
