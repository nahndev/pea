# Add rule creation

## Currently

- Rules are rows of the `rules` table (`type`, `description`, `severity`, `config`) and are only created by [seed.ts](../../apps/api/prisma/seed.ts); the API ([rules.controller.ts](../../apps/api/src/modules/rules/rules.controller.ts)) only has `GET /rules`, `GET /rules/:id` and `PATCH /rules/:id`.
- The rules page (`/rules`) only lists rules and opens `/rules/{id}` to edit severity and config; there is no way to add a rule from the UI.
- Users cannot add a second rule of the same type with a different threshold or severity (e.g. a stricter `SLOW_API`) without editing the seed and re-running it.

## Acceptance Criteria

- [x] Create new button create rules
- [x] Creation form include 2 step
- [x] First step select base rule
- [x] Second step allow change title, severity, config, ...
- [x] New rule keep type same with base type, using same behaviour

## Solutions

- [x] Add new endpoints
- [x] Add new UI
- [x] DON'T add link to base rules, forget after create
