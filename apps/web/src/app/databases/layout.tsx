import { Permission } from '@tomato/constants';
import type { ReactNode } from 'react';
import { ForbiddenState, RequirePermission } from '@/modules/auth';

export default function DatabasesLayout({ children }: { children: ReactNode }) {
  return (
    <RequirePermission permission={Permission.MANAGER_DATABASE} fallback={<ForbiddenState />}>
      {children}
    </RequirePermission>
  );
}
