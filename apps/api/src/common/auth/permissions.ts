import { Permission } from '@tomato/constants';

const PERMISSION_VALUES: readonly string[] = Object.values(Permission);

/** Drops values no longer in `Permission` */
export const toPermissions = (values: string[]): Permission[] =>
  values.filter((value): value is Permission => PERMISSION_VALUES.includes(value));
