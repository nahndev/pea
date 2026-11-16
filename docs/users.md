# Users and permissions

Every page and API route needs a signed-in user. A user belongs to one group, and the group's permissions decide
what the user can do.

## Permissions

`Permission` in `@tomato/constants`:

| Permission          | Grants                                                                              |
| ------------------- | ----------------------------------------------------------------------------------- |
| `branch:view`       | Branches, analyses, issues, metric results and trends                               |
| `branch:analysis`   | Create branches, run and re-run analyses, change issue status; list databases, add-ons |
| `branch:delete`     | Delete branches                                                                     |
| `manager:rule`      | Rules menu                                                                          |
| `manager:condition` | Conditions menu (also lists metrics)                                                |
| `manager:metric`    | Metrics and Chart menus                                                             |
| `manager:database`  | Databases menu                                                                      |
| `manager:user`      | Users and Groups menus                                                              |

A new permission is added to `Permission`, to `PERMISSION_SECTIONS` (web, `groups.constants.ts`) for its switch,
and to the routes that need it. The seed grants it to `Administrators`.

## API

- `AuthGuard` (global, `APP_GUARD`) reads the `pea_session` cookie and attaches the user to the request. No or an
  unknown session: `401 UNAUTHORIZED`. `@Public()` skips the check (`/health`, login, logout).
- `@RequirePermission(...permissions)` on a controller or method: the user needs **any** of them, otherwise
  `403 FORBIDDEN`. A method decorator replaces the controller one.
- `@AuthUser()` injects the `CurrentUser`.

```ts
@Controller('rules')
@RequirePermission(Permission.MANAGER_RULE)
export class RulesController {}
```

Sessions (`/rest/sessions`):

- `POST` `{ username, password }` sets the cookie (httpOnly, `SameSite=Lax`, 7 days) and returns the `CurrentUser`.
  Wrong username or password: `401 INVALID_CREDENTIALS`.
- `GET /current` returns the `CurrentUser` with its permissions.
- `DELETE /current` ends the session.

Only the SHA-256 of the cookie token is stored (`sessions`). Passwords are hashed with scrypt. Usernames are
lowercased. A new password, or deleting the user, ends all of the user's sessions. Permission changes apply on the
next request.

`SESSION_COOKIE_SECURE=true` marks the cookie `Secure`; set it when the app is served over HTTPS.

## Web

- `proxy.ts` redirects to `/login?next=…` when there is no session cookie; the API still validates the session.
- A `401` from the API sends the user to `/login`, then back to the page.
- `RequirePermission` (`@/modules/auth`) renders its children when the user has any of the permissions, else
  `fallback` (nothing by default). `useHasPermission` does the same check in code.

  ```tsx
  <RequirePermission permission={Permission.BRANCH_DELETE}>
    <DeleteBranchDialog branch={branch} />
  </RequirePermission>
  ```

- Each section has a `layout.tsx` with `RequirePermission` and `<ForbiddenState />` as fallback, so opening a URL
  without the permission shows "No access". `branches/new` and `analyses/new` need `branch:analysis`.
- Header menus, create / new analysis / re-analyse (`branch:analysis`), delete branch (`branch:delete`) and the issue
  status select (a badge without `branch:analysis`) are gated. Links to rules, metrics and databases from branch pages
  are plain text without the matching `manager:*` permission.

## First user

`pnpm seed` creates or updates the `Administrators` group with every permission. When no user exists it also creates
`admin` with the password in `ADMIN_PASSWORD`:

```sh
ADMIN_PASSWORD='a-long-secret' pnpm seed
```
