import { Permission } from '@tomato/constants';
import type { ReactNode } from 'react';
import { ForbiddenState, RequirePermission } from '@/modules/auth';

export default function GroupsLayout({ children }: { children: ReactNode }) {
  return (
    <RequirePermission permission={Permission.MANAGER_USER} fallback={<ForbiddenState />}>
      {children}
    </RequirePermission>
  );
}
