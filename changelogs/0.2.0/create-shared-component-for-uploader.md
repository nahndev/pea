# Create a shared component for the uploader

## Currently

- Three web forms upload a log file, each with its own copy of the same markup: `Label` + native `Input type="file"` + hint + error.
  - [log-file-input.tsx](../../apps/web/src/modules/analyses/components/log-file-input.tsx) — `API_METRIC`/`BUG` log in [new-analysis-form.tsx](../../apps/web/src/modules/analyses/components/new-analysis-form.tsx), driven by `LOG_FILE_FIELD_BY_SCHEMA` ([analyses.constants.ts](../../apps/web/src/modules/analyses/analyses.constants.ts)); uses the shared [field-error.tsx](../../apps/web/src/shared/components/field-error.tsx).
  - [leaneo-exceptions-convert-form.tsx](../../apps/web/src/modules/add-ons/leaneo-exceptions-convert/components/leaneo-exceptions-convert-form.tsx) and [leaneo-slow-api-convert-form.tsx](../../apps/web/src/modules/add-ons/leaneo-slow-api-convert/components/leaneo-slow-api-convert-form.tsx) — near-identical files; the field and the error `<p>` are inlined (duplicating `FieldError`).
- `accept=".json,.jsonl,.ndjson,.log,.txt"` is repeated in all three (order differs).
- File validation is duplicated per module (`instanceof File` → `file_required`, `size > 0` → `empty`, `size <= MAX` → `too_large`):
  - `logFileSchema` in `analyses.schemas.ts`, `convertExceptionsSchema`, `convertSlowApiSchema`;
  - each with its own `MAX_*_FILE_SIZE` constant and its own `FIELD_ERRORS` map with the same `empty` / `too_large` messages.
- The "no file picked" case is handled by hand in each form (`file instanceof File && file.name === ''` → `undefined`).
- The input is the plain browser file picker: no drag & drop, no selected file name/size preview, no clear button, and the size limit is only reported after submit.
- `@tomato/ui` has no file/upload component (only `input`, `label`, `button`, …); [shared/components](../../apps/web/src/shared/components) has none either.

## Acceptance Criteria

- [x] Create shared component for uploader
- [x] Support drag and drop to upload
- [ ]

## Solutions

- [x] `FileUploader` ([file-uploader.tsx](../../apps/web/src/shared/components/file-uploader.tsx)): controlled (`value` / `onChange`), drop zone + click to browse, shows the selected file name/size with a remove button, accepted types and size limit shown up front.
- [x] Shared rules in `shared/lib`: `LOG_FILE_ACCEPT`, `MAX_LOG_FILE_SIZE`, `LOG_FILE_ERRORS` ([log-file.constants.ts](../../apps/web/src/shared/lib/log-file.constants.ts)) and `logFileSchema` ([log-file.schemas.ts](../../apps/web/src/shared/lib/log-file.schemas.ts)); adds `invalid_type` since drops bypass `accept`.
- [x] New analysis, LeaneoExceptionsConvert and LeaneoSlowApiConvert forms use `FileUploader` + `logFileSchema`; per-module `MAX_*_FILE_SIZE` and the "no file picked" `FormData` workaround removed.
