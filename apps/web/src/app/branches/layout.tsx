import { Permission } from '@tomato/constants';
import type { ReactNode } from 'react';
import { ForbiddenState, RequirePermission } from '@/modules/auth';

export default function BranchesLayout({ children }: { children: ReactNode }) {
  return (
    <RequirePermission permission={Permission.BRANCH_VIEW} fallback={<ForbiddenState />}>
      {children}
    </RequirePermission>
  );
}
