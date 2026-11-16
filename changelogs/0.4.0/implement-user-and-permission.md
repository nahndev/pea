# Implement user and permission for user

## Currently

- There are no users: [schema.prisma](../../apps/api/prisma/schema.prisma) has no `User`/`Role`/`Permission` model, and no row records who created or changed it (e.g. `Analysis`, `Rule`, `Database` have no `createdBy`).
- The API is fully open: [main.ts](../../apps/api/src/main.ts) only sets the `rest` prefix, validation pipe and exception filter; there is no auth module, guard, session or token, and no auth library in [apps/api/package.json](../../apps/api/package.json).
- Anyone reaching the API can call every endpoint (22 `GET`, 8 `POST`, 5 `PATCH`, 2 `DELETE`), including sensitive ones:
  - delete a branch ([branches.controller.ts](../../apps/api/src/modules/branches/branches.controller.ts)) or a database ([databases.controller.ts](../../apps/api/src/modules/databases/databases.controller.ts));
  - create/edit database connections (stored AES-256-GCM encrypted in `Database.connection`), rules, metrics and conditions.
- The web app has no login page, no `middleware.ts` and no user menu; [app-header.tsx](../../apps/web/src/shared/components/app-header.tsx) shows every link to everyone, and [api-client.ts](../../apps/web/src/shared/lib/api-client.ts) sends no credentials.
- Only the error codes exist: `UNAUTHORIZED` / `FORBIDDEN` in [error-code.constants.ts](../../packages/constants/src/error-code.constants.ts) (mapped from 401 / 403), but nothing returns them.
- [env.schema.ts](../../packages/config/src/env.schema.ts) has no auth-related variable (secret, token TTL, …).

## Acceptance Criteria

- [x] Add menu `user` include `name` + `username` + `password` + `group`
- [x] Add menu `group` include `name` with permissions `branch:view`, `branch:analysis`,`manager:rule`, `manager:condition`, ... and list users
- [x] Add decorator for permission by router
- [x] Add UI for all

## Solutions

- [x] Tables `groups` (`name`, `permissions[]`), `users` (`name`, `username`, scrypt `password_hash`, `group_id`) and `sessions` (SHA-256 of the cookie token, `expires_at`); a user has one group, a group with users cannot be deleted.
- [x] Permissions in `@tomato/constants`: `branch:view`, `branch:analysis`, `branch:delete`, `manager:rule`, `manager:condition`, `manager:metric` (Metrics + Chart), `manager:database`, `manager:user` (Users + Groups).
- [x] Global `AuthGuard` reads the httpOnly `pea_session` cookie; `@Public()` opts out, `@RequirePermission(...)` passes with any of the permissions, `@AuthUser()` injects the user. Every existing route is annotated.
- [x] `/rest/sessions`: login, current user, logout. A new password or deleting a user ends their sessions.
- [x] Web: `/login`, `proxy.ts` redirect without cookie, 401 → login, header menus filtered by permission, user menu with sign out, `/users` and `/groups` pages.
- [x] `pnpm seed` keeps `Administrators` with every permission and creates `admin` from `ADMIN_PASSWORD` when no user exists. See [docs/users.md](../../docs/users.md).
