import { SetMetadata } from '@nestjs/common';
import type { Permission } from '@tomato/constants';

export const PERMISSIONS_KEY = 'permissions';

/** Passes when the user has any of the permissions; a method overrides its controller */
export const RequirePermission = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_KEY, permissions);
