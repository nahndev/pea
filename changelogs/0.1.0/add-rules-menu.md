# Add Rules menu to configure all rules

## Currently

- The app header ([app-header.tsx](../../apps/web/src/shared/components/app-header.tsx)) only has the `Branches` and `Add-ons` links; there is no entry point for rules.
- Rules are rows of the `rules` table (`type`, `description`, `config`) and can only be changed by editing [seed.ts](../../apps/api/prisma/seed.ts) and re-running the seed (see [rules.md](../../docs/rules.md)).
- The API ([rules module](../../apps/api/src/modules/rules/rules.service.ts)) only has `listAll()` for internal use; no controller exposes rules.
- Goal: add a `Rules` menu so users can view and configure every rule (e.g. `thresholdMs`, `maxPercent`, `minRequests`) from the UI.

## Acceptance Criteria

- [x] Add new page `rules`
- [x] Page include list of rules
- [x] Page details include `RuleConfig` component
- [x] Every `rule` has a `____RuleConfig` component support for this rules. IF factory return null, don't show config.

## Solutions

- [x] Add endpoints
- [x] Add UI
- [x] Add menu
