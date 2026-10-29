# Add create new branch button

## Currently

- The branches page ([branch-list-view.tsx](../../apps/web/src/modules/branches/components/branch-list-view.tsx)) only lists and searches branches.
- The API ([branches.controller.ts](../../apps/api/src/modules/branches/branches.controller.ts)) only exposes `GET /branches` and `GET /branches/:id`; there is no way to create a branch.
- Goal: add a `Create branch` button on the branches page so users can create a new branch from the UI.

## Acceptance Criteria

- [x] Add new button allow add new branch
- [x] Creating a branch whose name already exists shows an error
- [x] A newly created branch appears in the list before it has any analysis

## Solutions

- [x] Add endpoint
- [x] Add action
- [x] Add component (new module)
