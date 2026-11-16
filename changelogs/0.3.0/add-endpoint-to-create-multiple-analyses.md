# Add endpoint to create multiple analyses at once

## Currently

- `POST /analyses` ([analyses.controller.ts](../../apps/api/src/modules/analyses/analyses.controller.ts)) creates one analysis per request: `multipart/form-data` with `branch`, `schema`, `title`, optional `databaseId` / `addOn` ([create-analysis.dto.ts](../../apps/api/src/modules/analyses/dto/create-analysis.dto.ts)) and at most one log file per field (`FileFieldsInterceptor`, `maxCount: 1` for each `LogFileField`, `MAX_LOG_FILE_SIZE` 50 MB).
- To analyse several logs (e.g. `API` + `BUG` + `FRONTEND` of the same release, or several branches), the client has to send one request per analysis.
- `AnalysesService.create` ([analyses.service.ts](../../apps/api/src/modules/analyses/analyses.service.ts)) validates the database (`DATABASE`) or the uploaded file (`LOG_FILE_REQUIRED`), converts it with the add-on or saves it with `StorageService`, `findOrCreateByName` the branch, then inserts the `Analysis`. On a DB error it removes the saved file. Nothing is transactional across several analyses.
- `@EmitEvent(AnalysisEvent.CREATED)` ([emit-event.decorator.ts](../../apps/api/src/common/decorators/emit-event.decorator.ts)) fires `emit` (not awaited) after each create; [analysis-result.listener.ts](../../apps/api/src/modules/analysis-result/analysis-result.listener.ts) starts `AnalysisResultService.run` for it. Creating N analyses at once would start N runs in parallel, with no limit.
- `RemoveUploadsInterceptor` removes the temp uploads of the request after it ends, whatever the result.
- Web: [new-analysis-form.tsx](../../apps/web/src/modules/analyses/components/new-analysis-form.tsx) / [log-file-input.tsx](../../apps/web/src/modules/analyses/components/log-file-input.tsx) send one analysis through [analyses.service.ts](../../apps/web/src/modules/analyses/services/analyses.service.ts).

## Acceptance Criteria

- [ ] Add new endpoint POST /rest/analysis-bulk
- [ ] Payload is list of current payload POST /rest/analyses
- [ ] Branch support `slug`, allow identify with `slug` instead of `uuid`

## Solutions

- [ ]
- [ ]
- [ ]
