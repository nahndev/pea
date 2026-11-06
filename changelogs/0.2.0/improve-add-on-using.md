# Improve add-on using

## Currently

- Add-ons are listed at `/add-ons` ([add-on-list-view.tsx](../../apps/web/src/modules/add-ons/components/add-on-list-view.tsx)) from `ADD_ONS` ([add-ons.constants.ts](../../apps/web/src/modules/add-ons/add-ons.constants.ts)); each card only shows a name and a description. See [docs/add-ons.md](../../docs/add-ons.md).
- 2 add-ons, each with its own page, form, hook, service and API endpoint:
  - `LeaneoSlowApiConvert`: `slow_api.log` → `api_metric.log` ([form](../../apps/web/src/modules/add-ons/leaneo-slow-api-convert/components/leaneo-slow-api-convert-form.tsx), `POST /rest/add-ons/leaneo-slow-api-convert`)
  - `LeaneoExceptionsConvert`: `exceptions.log` → `bug_log.log` ([form](../../apps/web/src/modules/add-ons/leaneo-exceptions-convert/components/leaneo-exceptions-convert-form.tsx), `POST /rest/add-ons/leaneo-exceptions-convert`)
- Flow today: open the add-on → upload the raw log → Convert → result card with converted/skipped counts (`AddOnHeader` response headers) → **Download** the file → follow the link to `/analyses/new` (`?schema=BUG` for exceptions) → upload the downloaded file again as the log of the new analysis.
  - The converted file is a blob URL kept only in the form state; it is lost on navigation, so the user must download then re-upload it manually.
  - Skipped lines are only counted; the user cannot see which lines or why.
- From the new analysis form, [log-file-input.tsx](../../apps/web/src/modules/analyses/components/log-file-input.tsx) links to the converter (`converter` in [analyses.constants.ts](../../apps/web/src/modules/analyses/analyses.constants.ts)), which leaves the form and loses what was already filled in.
- Both forms are near copies (only schema, hook, labels, hint and output name differ); both APIs share `MAX_ADD_ON_FILE_SIZE` (50 MB) and the same response shape. Adding an add-on means copying a whole folder on web and api.
- Add-on names are class-like identifiers (`LeaneoSlowApiConvert`), not user-friendly labels; the list cards give no hint of input → output format.

## Acceptance Criteria

- [x] In New analysis form -> show switch for add-on `leaneo`
- [x] If add-on active, instead upload `api_metric.json`, allow user upload leaneo json format
- [x] After upload, server run add-on `leaneo` convert it into `api_metric.json`
- [x] Remove `Add-on` menu
- [x] Support for api and bugs

## Solutions

- [x] `AddOn` constant (`LEANEO`) in `@tomato/constants`; `POST /analyses` takes an optional `addOn` next to the log file
- [x] `AddOnsService` maps add-on + schema to a converter (`API`/`QUERY` → LeaneoSlowApiConvert, `BUG` → LeaneoExceptionsConvert); `AnalysesService.create` converts the upload before saving it, so the stored file is always the schema's format
- [x] New analysis form: `Leaneo add-on` switch for log schemas, the upload label and hint switch to the Leaneo format
- [x] Removed the `Add-ons` menu, the `/add-ons` pages, the web add-ons module, the convert endpoints and `AddOnHeader`
- [x] Docs: [add-ons.md](../../docs/add-ons.md), [api_metric.md](../../docs/api_metric.md), [bug_log.md](../../docs/bug_log.md)
