---
name: theme
description: Generate a new theme (light + dark) for @tomato/tailwind-config from a pasted palette of 3-5 colors. Use when asked to create/add a theme from colors.
---

# Generate a theme from a palette

Input: a list of 3-5 hex colors from a palette, and a theme name (ask if missing).

## Steps

1. Run from the repo root (optional `primary=#hex` / `accent=` / `neutral=` override the picks):

   ```bash
   pnpm --filter @tomato/tailwind-config theme <name> <hex> <hex> <hex> [<hex>] [<hex>]
   ```

2. It writes `theme/themes/<name>.css`, imports it in `theme/themes/index.css`, adds the name to `Theme` in `@tomato/constants`, then runs the theme lint.
3. Show the user the role picks it printed; if one looks wrong, rerun with an override.

## What it does

- Roles: `neutral` = lowest chroma; `primary` = first remaining color; `accent` = farthest hue from primary. Remaining colors are dropped.
- Per role, 14 values generated in OKLCH: `--<role>` (solid) plus the suffixes `-foreground` (text on solid), `-hover`, `-active`, `-focus`, `-disabled`, `-disabled-foreground` (text on disabled), `-soft`, `-soft-hover`, `-selected`, `-soft-foreground` (text on soft / selected), `-border`, `-border-hover`, `-border-strong`. Text tokens always end in `-foreground`; solid keeps white text at >= 4.5:1.
- Dark: same roles, lightened solid, dark washes.
- Neutral ladder, tinted with the neutral hue: `canvas` (app backdrop), `card` (cards, popovers, dialogs), `muted`, `inset` and `inset-hover` (recessed fills), `muted-foreground` (secondary text), `border`, `input`.
- Untouched: Fixed (`background`, `foreground`, `overlay`, copied from twilight) and semantic tones (`semantic.css`).

## Notes

- Never edit generated values by hand to fix contrast; change the input colors and rerun.
- Usage in the app: `data-theme="<name>"` (see README §4). Components use `primary` by default; `accent`, `neutral`... are color classes (`variant-soft accent`).
