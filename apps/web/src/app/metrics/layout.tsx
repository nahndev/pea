import { Permission } from '@tomato/constants';
import type { ReactNode } from 'react';
import { ForbiddenState, RequirePermission } from '@/modules/auth';

export default function MetricsLayout({ children }: { children: ReactNode }) {
  return (
    <RequirePermission permission={Permission.MANAGER_METRIC} fallback={<ForbiddenState />}>
      {children}
    </RequirePermission>
  );
}
