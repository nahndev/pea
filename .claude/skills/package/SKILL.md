---
name: package
description: Add a new shared package (@tomato/<name>) to packages/. Use when asked to create/add a new package.
---

# Add a new package

Argument: `<name>` — package name in `kebab-case`; the package is published in the workspace as `@tomato/<name>` (see `CONTRIBUTING.md`).

## Before creating

- Create a package only when it has **≥ 2 consumers**. Otherwise put the code in an existing package (`constants`, `types`, `utils`, `ui`) or in a module.
- `packages` **must not** import `apps`.
- `constants`, `types`, `utils`-like packages **must not** depend on any framework. `ui`-like packages (React) are for web only.

## Steps

1. Pick the tsconfig preset: `library.json` (default) or `react-library.json` (React components).
2. Create `packages/<name>/` using this layout:

   ```
   <name>/
   ├── src/
   │   └── index.ts
   ├── eslint.config.mjs
   ├── package.json
   └── tsconfig.json
   ```

3. `package.json` (copy from `packages/utils/package.json`, change `name`):

   ```json
   {
     "name": "@tomato/<name>",
     "version": "0.0.0",
     "private": true,
     "main": "./dist/index.js",
     "module": "./dist/index.mjs",
     "types": "./dist/index.d.ts",
     "exports": {
       ".": {
         "types": "./dist/index.d.ts",
         "import": "./dist/index.mjs",
         "require": "./dist/index.js"
       }
     },
     "files": ["dist"],
     "scripts": {
       "build": "tsup src/index.ts --format cjs,esm --dts --clean",
       "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
       "lint": "eslint .",
       "typecheck": "tsc --noEmit",
       "test": "vitest run"
     },
     "devDependencies": {
       "@tomato/eslint-config": "workspace:*",
       "@tomato/tsconfig": "workspace:*",
       "eslint": "^10.12.0",
       "tsup": "^8.5.1",
       "typescript": "~6.0.3",
       "vitest": "^5.0.3"
     }
   }
   ```

   - Drop the `test` script and `vitest` if there are no tests.
   - Runtime deps go in `dependencies` (e.g. `zod` for env validation). React packages: add `react` as `peerDependencies` + `devDependencies` and `@types/react` (see `packages/ui/package.json`).

4. `tsconfig.json`:

   ```json
   {
     "extends": "@tomato/tsconfig/library.json",
     "include": ["src"]
   }
   ```

5. `eslint.config.mjs`:

   ```js
   import base from "@tomato/eslint-config";

   export default base;
   ```

6. `src/index.ts` — the only entry point; re-export everything public from it (`export * from './<file>';`). File names follow `CONTRIBUTING.md` (`<name>.constants.ts`, `<name>.types.ts`, `kebab-case.ts`, tests `<name>.spec.ts`).
7. Add the package to each consumer: `"@tomato/<name>": "workspace:*"` in the consumer's `package.json` (`dependencies`), then run `pnpm install` at the repo root.
8. Verify: `pnpm build && pnpm typecheck && pnpm lint && pnpm test`.
9. Update the **Shared Packages** list in `README.md` (`@tomato/<name>`: purpose).

## Notes

- Do not edit `pnpm-workspace.yaml` or `turbo.json`: `packages/*` is already a workspace glob and Turborepo tasks (`^build`) pick the new package up automatically.
- `dist/` is built by tsup and gitignored; never commit it.
- Consumers import only from `@tomato/<name>` (never `@tomato/<name>/src/...`).
