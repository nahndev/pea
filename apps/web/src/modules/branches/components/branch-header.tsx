'use client';

import { Skeleton, buttonVariants } from '@tomato/ui';
import Link from 'next/link';
import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { ErrorState } from '@/shared/components/error-state';
import { PageHeader } from '@/shared/components/page-header';
import { buildHref } from '@/shared/lib/pagination';
import { useBranch } from '../hooks/use-branches';

interface BranchHeaderProps {
  branchId: string;
}

export function BranchHeader({ branchId }: BranchHeaderProps) {
  const { data, error } = useBranch(branchId);

  if (error) return <ErrorState error={error} />;
  if (!data) return <Skeleton className="h-16 w-full max-w-md" />;

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <PageHeader title={data.name} description="Analysis results for this branch, newest first.">
        <Breadcrumbs entries={[{ label: 'Branches', href: '/branches' }, { label: data.name }]} />
      </PageHeader>
      <Link href={buildHref('/analyses/new', { branch: data.name })} className={buttonVariants({ variant: 'outlined', size: 'sm' })}>
        New analysis
      </Link>
    </div>
  );
}
