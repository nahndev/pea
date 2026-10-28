# Pea - Performance analysis

This project aims to build a tool similar to SonarQube, but focused on system performance.

## 1. Tech Stack

- Language: TypeScript
- Frontend: Next.js, tailwind 4, shadcn/ui, zustand, tanstack-query, clsx, axios
- Backend: NestJS, Prisma
- Validation: Zod
- Monorepo: pnpm workspaces + Turborepo

## 2. Overview

- Monorepo: **pnpm workspaces + Turborepo**
- `apps/`: runnable applications (web, api)
- `packages/`: libraries shared between modules
- `modules/` (optional): individual business modules, each may have its own web + api parts

```
.
├── apps/
│   ├── web/                    # Next.js (App Router)
│   │   └── src/
│   │       ├── app/            # routes
│   │       ├── modules/        # UI per business module
│   │       │   └── <module>/
│   │       │       ├── components/
│   │       │       ├── hooks/
│   │       │       ├── services/
│   │       │       └── index.ts
│   │       └── shared/         # web-only code (e.g. lib/api-client.ts — axios instance)
│   └── api/                    # NestJS
│       └── src/
│           ├── modules/
│           │   └── <module>/
│           │       ├── <module>.module.ts
│           │       ├── <module>.controller.ts
│           │       ├── <module>.service.ts
│           │       ├── <module>.repository.ts
│           │       ├── dto/
│           │       ├── entities/
│           │       └── <module>.constants.ts
│           ├── common/         # guard, filter, interceptor, pipe (HttpExceptionFilter, ZodValidationPipe)
│           └── main.ts
├── packages/
│   ├── constants/              # shared constants (error code, ...)
│   ├── types/                  # types/interfaces shared by FE + BE
│   ├── utils/                  # pure utility functions
│   ├── ui/                     # shared UI components (shadcn/ui)
│   ├── tailwind-config/        # Tailwind 4 theme (theme/, utilities/, base.css)
│   ├── eslint-config/
│   └── tsconfig/
├── changelogs/                 # tickets: <name>.md
├── docs/
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## 3. Running the Project

```bash
pnpm install
pnpm dev        # web (http://localhost:3000) + api (http://localhost:3001/api)
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

- Scripts run through Turborepo; `packages/*` are built (tsup → `dist/`) before the apps use them.
- Database (api): `docker compose up -d` starts PostgreSQL; copy `apps/api/.env.example` → `apps/api/.env` (`DATABASE_URL`), then `pnpm migrate` (dev migration; `pnpm --filter @tomato/api migrate:deploy` in production). `pnpm generate` regenerates the Prisma client in `apps/api/src/generated` (gitignored); it also runs on install/build/dev.
- Web environment variables: copy `apps/web/.env.example` → `apps/web/.env.local` (`NEXT_PUBLIC_API_URL`).
- The api listens on `PORT` (default `3001`) with the `/api` prefix, e.g. `GET /api/health`. Swagger UI is served at `/api/docs`.
- The api validates its env at startup (`@tomato/config`, zod) and refuses to start when a variable is missing or invalid: every variable listed in its `.env.example` is required, there are no defaults.

## 4. Shared Packages

- `@tomato/constants`: constants, error codes
- `@tomato/types`: types/interfaces
- `@tomato/utils`: pure functions
- `@tomato/config`: env validation (zod) + `@nestjs/config` module for Nest apps
- `@tomato/ui`: React components
- `@tomato/tailwind-config`: Tailwind 4 theme
- `@tomato/eslint-config`, `@tomato/tsconfig`: lint / tsconfig presets

Using Tailwind in an app:

```css
/* apps/web/src/app/globals.css */
@import "@tomato/tailwind-config";
@source '../../../../packages/ui/src';
```

Theme system (`packages/tailwind-config`):

```
base.css                 entry: imports theme + utilities, base layer
theme/
  index.css              exposes tokens to Tailwind (`bg-primary`, `bg-hover`...); radius, motion
  semantic.css           success / warning / danger / info: fixed across themes (light / dark)
  elevation.css          shadows (fixed; light / dark)
  themes/<name>.css      one theme: fixed colors, neutral ladder and 4 role tones, light + dark
utilities/
  state.css              state variants (`is-hover`, `is-active`, `is-selected`, `is-disabled`), focus-ring
  motion.css             motion-base
  intent.css             intent classes (primary, accent, neutral, success, warning, danger, info): point the generic color variables at one color group
  variant.css            shape classes: variant-solid | variant-soft | variant-outlined | variant-ghost
scripts/check-themes.mjs validates semantic.css and every theme (`pnpm lint`)
```

**Colors are data, not logic.** Nothing is derived in CSS: the files hold every value, produced by your color tool, for light and dark.

| Group          | Tokens                                                                                   | Lives in                                    |
| -------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------- |
| Fixed          | `background`, `foreground`, `overlay`                                                    | each theme                                  |
| Neutral ladder | `canvas`, `card`, `muted`, `inset`, `inset-hover`, `muted-foreground`, `border`, `input` | each theme                                  |
| Role tones     | `primary`, `accent`, `neutral`                                                           | each theme                                  |
| Semantic tones | `success`, `warning`, `danger`, `info`                                                   | `theme/semantic.css` (same for every theme) |

Each tone, role or semantic, has 14 values: `--<tone>` (solid), `-foreground`, `-hover`, `-active`, `-focus`, `-disabled`, `-disabled-foreground`, `-soft`, `-soft-hover`, `-selected`, `-soft-foreground`, `-border`, `-border-hover`, `-border-strong` (the generic classes below name them `solid`, `solid-foreground`, `hover`, `active`, `focus`, `disabled`, `disabled-foreground`, `soft`, `soft-hover`, `selected`, `soft-foreground`, `outline`, `outline-hover`, `outline-strong`).

- Role usage: `primary` = main action, link, focus. `accent` = secondary action and contrasting emphasis, selected / hover washes. `neutral` = quiet actions (ghost, outline, menu items). One `primary` action per area.
- Surfaces, back to front: `canvas` < `background` < `card` (cards, popovers, dialogs, sidebar). `muted` and `inset` are recessed fills (chips, avatars, grouped areas). `foreground` is text, `muted-foreground` is secondary text, `border` separates, `input` outlines controls.
- Semantic tones are ordinary colors (`success`...) but do not change with the theme; edit `theme/semantic.css` to restyle them for everyone.

**Usage.** A component picks an intent (`primary`, `danger`...) and a shape (`variant-solid`, `variant-soft`, `variant-outlined`, `variant-ghost`); hover, active, focus, disabled and selected come from the theme through the intent:

```tsx
<button className="variant-solid">Publish</button>
<button className="variant-soft accent">Save draft</button>
<button className="variant-ghost neutral is-selected:primary" aria-pressed={isOn}>…</button>
<span className="variant-soft success">Paid</span>
```

- State variants are named after the 5 states a color provides: `is-hover:`, `is-active:` (pressed), `is-selected:`, `is-disabled:`; focus is `focus-ring`. Unlike Tailwind's `hover:` they match ARIA / data attributes and skip disabled controls.
- Shapes: `variant-solid` (filled), `variant-soft` (tinted), `variant-outlined`, `variant-ghost` (`outline` is Tailwind's own utility). Selected is `aria-pressed` / `aria-selected` / `aria-current="page"` / `data-selected="true"` / `data-state="on|active|checked"`; disabled is `:disabled` / `aria-disabled` / `data-disabled`.
- Custom spots read the nearest intent class: `bg-solid`, `text-solid-foreground`, `hover:bg-hover`, `bg-soft`, `bg-selected`, `text-soft-foreground`, `border-outline` (`-hover`, `-strong`), `bg-disabled`, plus `focus-ring`. They are different from the token fills `bg-primary`, `bg-danger`, which always mean that fixed color. No intent class = `primary`.
- Surfaces are token fills composed in the component, back to front: `bg-canvas` (app backdrop) < `bg-background` < `bg-card` (cards, popovers, dialogs) with `shadow-card|popover|modal`; `bg-muted` and `bg-inset` (`hover:bg-inset-hover`) are recessed; `bg-overlay` is the scrim; form controls use `border-input bg-background`.
- Never use palette values or Tailwind palette colors (`slate-*`, `red-*`) in components.

**Themes**

- One palette = one theme. Add one: copy `twilight.css`, rename its selectors, replace the values, `@import` it in `theme/themes/index.css`, add the name to `Theme` (`@tomato/constants`), run `pnpm lint`.
- Generate one from a 3-5 color palette: `/theme` (or `pnpm --filter @tomato/tailwind-config theme <name> <hex>...`).
- Selectors: light `[data-theme="<name>"]`; dark `[data-theme="<name>"].dark, .dark [data-theme="<name>"]`. Switch with `data-theme` on `<html>` or any element (nested scopes work); put `dark` on `<html>` or an ancestor of the `data-theme` element.
- `pnpm lint` fails when a token is missing, a value is not a hex color, or text contrast is below 4.5:1 (control outline below 3:1); focus rings below 3:1 are warnings. Semantic tones are also checked against every theme's surfaces.

## 5. Error Handling

- The `ErrorCode` object is declared in `@tomato/constants`. The api returns only `code`; display messages are defined by each app per `code` (no hard-coded messages in the api or shared packages).
- The api returns errors as `ApiErrorResponse` (`@tomato/types`): `{ error: { code, details? } }`, produced by `HttpExceptionFilter`. Currently `code` is derived from the HTTP status (`HttpStatusErrorCode`).
- Api validates input with DTO classes (`class-validator`) via the global `ValidationPipe` (`createValidationPipe`); validation errors are in `error.details` (`{ field: string[] }`). Web defines its own zod schemas when needed.
- Web: `shared/lib/api-client.ts` exports the axios instance `apiClient` and `getApiError(error)` to read `ApiError` from an axios error.
