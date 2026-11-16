import { Permission } from '@tomato/constants';
import type { ReactNode } from 'react';
import { ForbiddenState, RequirePermission } from '@/modules/auth';

export default function AnalysesLayout({ children }: { children: ReactNode }) {
  return (
    <RequirePermission permission={Permission.REPO_VIEW} fallback={<ForbiddenState />}>
      {children}
    </RequirePermission>
  );
}
