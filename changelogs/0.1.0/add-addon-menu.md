# Add Addon menu

## Currently

- The app header ([app-header.tsx](../../apps/web/src/shared/components/app-header.tsx)) only has the `Branches` link.
- There is no entry point for addons, so users cannot reach them from the navigation.
- Goal: add an `Addon` menu to the header navigation.

## Acceptance Criteria

- [x] Add new page for Add-on
- [x] Menu include multiple tools support some feature
- [x] Them 1 cong cu LeaneoSlowApiConvert
- [x] Cong cu nay chuyen file `/slow_api.log` thanh format tich hop voi chuan `OTLP` co the dung cho chuc nang phan tich

## Solutions

- [x] Them component
- [x] Doc file, tao function chuyen doi
- [x] Tao `module` moi cho add-on, moi add-on la mot thu muc doc lap
