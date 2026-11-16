import type { Permission } from '@tomato/constants';
import type { CurrentUser } from '@tomato/types';

/** Any of the permissions is enough */
export const hasPermission = (user: CurrentUser | undefined, permission: Permission | Permission[]) =>
  Boolean(user && (Array.isArray(permission) ? permission : [permission]).some((value) => user.permissions.includes(value)));
