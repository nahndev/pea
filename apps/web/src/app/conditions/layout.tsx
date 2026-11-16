import { Permission } from '@tomato/constants';
import type { ReactNode } from 'react';
import { ForbiddenState, RequirePermission } from '@/modules/auth';

export default function ConditionsLayout({ children }: { children: ReactNode }) {
  return (
    <RequirePermission permission={Permission.MANAGER_CONDITION} fallback={<ForbiddenState />}>
      {children}
    </RequirePermission>
  );
}
