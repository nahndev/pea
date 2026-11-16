'use client';

import { type AnalysisSchema, Permission } from '@tomato/constants';
import { Skeleton, buttonVariants } from '@tomato/ui';
import Link from 'next/link';
import { RequirePermission } from '@/modules/auth';
import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { ErrorState } from '@/shared/components/error-state';
import { PageHeader } from '@/shared/components/page-header';
import { buildHref } from '@/shared/lib/pagination';
import { useBranch } from '../hooks/use-branches';
import { DeleteBranchDialog } from './delete-branch-dialog';

interface BranchHeaderProps {
  branchId: string;
  schema: AnalysisSchema;
}

export function BranchHeader({ branchId, schema }: BranchHeaderProps) {
  const { data, error } = useBranch(branchId);

  if (error) return <ErrorState error={error} />;
  if (!data) return <Skeleton className="h-16 w-full max-w-md" />;

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <PageHeader title={data.name} description="Analysis results for this branch, newest first.">
        <Breadcrumbs entries={[{ label: 'Branches', href: '/branches' }, { label: data.name }]} />
      </PageHeader>
      <div className="flex gap-2">
        <RequirePermission permission={Permission.BRANCH_ANALYSIS}>
          <Link href={buildHref('/analyses/new', { branch: data.name, schema })} className={buttonVariants({ variant: 'outlined', size: 'sm' })}>
            New analysis
          </Link>
        </RequirePermission>
        <RequirePermission permission={Permission.BRANCH_DELETE}>
          <DeleteBranchDialog branch={data} />
        </RequirePermission>
      </div>
    </div>
  );
}
