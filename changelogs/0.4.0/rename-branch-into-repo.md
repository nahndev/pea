# Rename Branch into Repo

## Currently

- The top-level entity that groups analyses is called **Branch** everywhere, from the database to the UI.
- Database ([schema.prisma](../../apps/api/prisma/schema.prisma)):
  - model `Branch` → table `branches` (`id`, `name`, `slug`);
  - `Analysis.branchId` → column `branch_id` with the index `[branchId, schema, createdAt]`;
  - two migrations are named after it: `replace_merge_request_with_branch`, `add_branch_slug`.
- API (`apps/api/src`, 34 files, ~400 hits):
  - module [branches/](../../apps/api/src/modules/branches/): `BranchesService` (incl. `findOrCreateByName`), `BranchesRepository`, `branch-slug.ts`, DTOs `create-branch.dto.ts`, `list-branches-query.dto.ts`;
  - routes `/rest/branches`, `/rest/branches/:idOrSlug` and [branch-analyses.controller.ts](../../apps/api/src/modules/analyses/branch-analyses.controller.ts) (`/branches/:idOrSlug/analyses`, `/analysis-counts`, `/metrics/trend`);
  - [create-analysis.dto.ts](../../apps/api/src/modules/analyses/dto/create-analysis.dto.ts) takes `branch` (a name; the branch is created when missing), also used by `analysis-bulk`.
- Shared packages:
  - [branch.types.ts](../../packages/types/src/branch.types.ts): `Branch`, `BranchSummary`; `AnalysisView.branch` and the metric history `analysis.branch`;
  - error codes `BRANCH_NOT_FOUND`, `BRANCH_ALREADY_EXISTS`;
  - permissions `branch:view`, `branch:analysis`, `branch:delete` (stored as strings in `groups.permissions`);
  - sort fields `BranchSortField` and `MetricHistorySortField.BRANCH`.
- Web (`apps/web/src`, 54 files, ~440 hits):
  - routes [app/branches/](../../apps/web/src/app/branches/) (`/branches`, `/branches/new`, `/branches/[id]/[type]`), and `/analyses/new?branch=…`;
  - module [modules/branches/](../../apps/web/src/modules/branches/) (list, header, create form, delete dialog, schema pages, `branch-schema-href.ts`);
  - ~56 UI labels ("Branches" menu, "Create branch", breadcrumbs, empty states…); `SortTable.BRANCHES` is the key of a stored ordering cookie (`pea-ordering-branches`).
- Docs and tickets: [rules.md](../../docs/rules.md), [users.md](../../docs/users.md) and older tickets in `changelogs/` mention branches.

## Acceptance Criteria

- [x] Change name for database, module, folder, files, record, variable, note, docs, .....
- [x] Drop all data on database

## Solutions

- [x] Case-preserving rename `Branches/branches/BRANCHES` → `Repos/repos/REPOS` and `Branch/branch/BRANCH` → `Repo/repo/REPO` in the api, web, shared packages, seed and `docs/`; 38 files/folders moved with `git mv`. Applied migrations and older tickets are left as history.
- [x] Migration `rename_branch_to_repo` deletes all analyses, drops `branches`, creates `repos` with `analyses.repo_id`, and rewrites stored `branch:*` permissions to `repo:*`.
- [x] Breaking: routes `/rest/repos`, `/repos`, the analysis field `repo` (was `branch`), error codes `REPO_*`, permissions `repo:*`; the saved repo list ordering resets (cookie `pea-ordering-repos`).
