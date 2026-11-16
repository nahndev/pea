import { Permission } from '@tomato/constants';
import type { ReactNode } from 'react';
import { ForbiddenState, RequirePermission } from '@/modules/auth';

export default function RulesLayout({ children }: { children: ReactNode }) {
  return (
    <RequirePermission permission={Permission.MANAGER_RULE} fallback={<ForbiddenState />}>
      {children}
    </RequirePermission>
  );
}
