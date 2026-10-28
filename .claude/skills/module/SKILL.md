---
name: module
description: Add a new business module to the monorepo (NestJS api + Next.js web). Use when asked to create/add a new module.
---

# Add a new module

Argument: `<module>` — module name in `kebab-case` (see `CONTRIBUTING.md` at the repo root for naming conventions).

## Steps

1. Create `apps/api/src/modules/<module>/` using this layout:

   ```
   <module>/
   ├── <module>.module.ts
   ├── <module>.controller.ts
   ├── <module>.service.ts
   ├── <module>.repository.ts
   ├── dto/
   ├── entities/
   └── <module>.constants.ts
   ```

2. Create `apps/web/src/modules/<module>/` using this layout:

   ```
   <module>/
   ├── components/
   ├── hooks/
   ├── services/
   └── index.ts
   ```

3. Constants/types shared by FE + BE → put them in `packages/constants`, `packages/types`. Api validates with DTO classes (class-validator); web defines its own zod schemas. Create a new package only when it has ≥ 2 consumers.
4. Register the module in `AppModule` (api) and add routes in `apps/web/src/app/` (web).
5. Write tests and update `docs/`.

## Notes

- Web: a module is exposed only through `index.ts`; never import internal files of another web module. NestJS modules are exempt (no `index.ts` needed; import `*.module.ts` and its exported providers).
- Controllers only receive/return data, logic lives in the service, DB access in the repository.
- Web: do not call the API directly in components; go through `services/` (using the axios instance in `shared/lib`).
