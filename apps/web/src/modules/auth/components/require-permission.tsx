'use client';

import type { Permission } from '@tomato/constants';
import type { ReactNode } from 'react';
import { useCurrentUser } from '../hooks/use-auth';
import { hasPermission } from '../permissions';

interface RequirePermissionProps {
  /** Any of them is enough */
  permission: Permission | Permission[];
  /** Shown without the permission */
  fallback?: ReactNode;
  children: ReactNode;
}

/** Renders nothing while the user loads, so neither side flashes */
export function RequirePermission({ permission, fallback = null, children }: RequirePermissionProps) {
  const { data: user, isPending } = useCurrentUser();

  if (isPending) return null;
  return hasPermission(user, permission) ? children : fallback;
}
