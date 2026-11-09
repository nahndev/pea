# Refactor Leaneo into a plugin

## Currently

- Leaneo is hard-coded across the stack ([docs/add-ons.md](../../docs/add-ons.md)):
  - `AddOn` constant (`LEANEO`) in [add-on.constants.ts](../../packages/constants/src/add-on.constants.ts), validated by `CreateAnalysisDto.addOn`
  - [add-ons.service.ts](../../apps/api/src/modules/add-ons/add-ons.service.ts) maps add-on + schema to a converter in a `Record` built in its constructor; both converters are NestJS providers in [add-ons.module.ts](../../apps/api/src/modules/add-ons/add-ons.module.ts)
  - Converters: [leaneo-slow-api-convert](../../apps/api/src/modules/add-ons/leaneo-slow-api-convert/) (`API`, `QUERY`) and [leaneo-exceptions-convert](../../apps/api/src/modules/add-ons/leaneo-exceptions-convert/) (`BUG`), sharing [to-route.ts](../../apps/api/src/modules/add-ons/to-route.ts)
  - Web: a single `Leaneo add-on` switch and its text (`LEANEO_ADD_ON` in [analyses.constants.ts](../../apps/web/src/modules/analyses/analyses.constants.ts)) in [new-analysis-form.tsx](../../apps/web/src/modules/analyses/components/new-analysis-form.tsx); the zod schema only accepts known `AddOn` values
- Adding an add-on means touching the constants package, the add-ons module, the service map, the analyses DTO and the web form, then rebuilding and redeploying.
- No metadata describes an add-on (id, version, label, which schemas and input files it supports); the web cannot list add-ons from the API.
- Converter contract (`LogConverter.convert(file): ConvertResult`) takes the whole Multer buffer (up to 50 MB in memory) and returns the whole output as one string; every converter repeats the same split / parse / skip / count loop and throws `LOG_FILE_INVALID` itself.
- `converted` / `skipped` counts are computed but no longer reach the user since the add-on pages were removed.
- Direction (VS Code-like extensions, step 1): an add-on is a self-contained folder with a manifest declaring what it contributes, discovered by a registry, so Leaneo becomes the first plugin and no core module knows its name.

## Acceptance Criteria

- [x] Plugin nội bộ (nên làm ngay, ít tốn công).
      Mỗi add-on là một thư mục có manifest cộng code, nằm trong repo.
      Một registry tự tìm các add-on lúc khởi động. API có GET /add-ons, web render động.
      Leaneo chuyển sang dạng này. Thêm add-on mới chỉ cần thêm thư mục, không đụng tới analyses.
      Đổi hợp đồng sang xử lý từng dòng để đọc file theo stream, thay vì nạp cả 50 MB vào bộ nhớ như bây giờ.

## Solutions

- [x] Plugin folder `apps/api/src/modules/add-ons/plugins/<id>/`: `index.ts` default-exports `AddOnPlugin` = `{ manifest, converters }`; `AddOnManifest` (id, version, label, description, converters with schemas / input / hint) lives in `@tomato/types`
- [x] `AddOnRegistry` discovers `plugins/*` at startup and validates each manifest (unique id, one converter per schema, every converter implemented); `GET /add-ons` returns the manifests
- [x] Leaneo moved to `plugins/leaneo/` (`slow-api`, `exceptions` converters); `AddOn` constant removed, `addOn` is any add-on id, unknown id or schema → `ADD_ON_NOT_FOUND`
- [x] Converter contract is `LineConverter = (line) => record | null`; `convertLines` streams the upload with `readline`, writes NDJSON and counts lines, so converters no longer repeat the loop or throw `LOG_FILE_INVALID`
- [x] Analysis uploads go to a temp folder (`diskStorage`) and stream to storage (`StorageService.saveStream` / `open`); `RemoveUploadsInterceptor` deletes temp files when the request ends
- [x] Web `add-ons` module (`useAddOns`, `AddOnSwitches`): the form renders one switch per add-on supporting the schema from `GET /add-ons`; `LEANEO_ADD_ON` removed
- [x] Docs: [add-ons.md](../../docs/add-ons.md)
- [ ] Not done: converted / skipped counts are still not shown to the user
