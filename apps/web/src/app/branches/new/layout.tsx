import { Permission } from '@tomato/constants';
import type { ReactNode } from 'react';
import { ForbiddenState, RequirePermission } from '@/modules/auth';

export default function CreateBranchLayout({ children }: { children: ReactNode }) {
  return (
    <RequirePermission permission={Permission.BRANCH_ANALYSIS} fallback={<ForbiddenState />}>
      {children}
    </RequirePermission>
  );
}
