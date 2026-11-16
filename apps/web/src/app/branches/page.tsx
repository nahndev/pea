import { Permission } from '@tomato/constants';
import { buttonVariants } from '@tomato/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { RequirePermission } from '@/modules/auth';
import { BranchListView, branchListParamsSchema } from '@/modules/branches';
import { PageHeader } from '@/shared/components/page-header';
import { withCachedOrdering } from '@/shared/lib/sort-cache';
import { SortTable } from '@/shared/lib/sort.constants';

export const metadata: Metadata = { title: 'Branches' };

interface BranchesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BranchesPage({ searchParams }: BranchesPageProps) {
  const params = branchListParamsSchema.parse(await withCachedOrdering(SortTable.BRANCHES, await searchParams));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Branches" description="Branches, most recently analysed first." />
        <RequirePermission permission={Permission.BRANCH_ANALYSIS}>
          <Link href="/branches/new" className={buttonVariants({ size: 'sm' })}>
            Create branch
          </Link>
        </RequirePermission>
      </div>
      <BranchListView params={params} />
    </>
  );
}
