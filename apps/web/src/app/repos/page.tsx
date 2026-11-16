import { Permission } from '@tomato/constants';
import { buttonVariants } from '@tomato/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { RequirePermission } from '@/modules/auth';
import { RepoListView, repoListParamsSchema } from '@/modules/repos';
import { PageHeader } from '@/shared/components/page-header';
import { withCachedOrdering } from '@/shared/lib/sort-cache';
import { SortTable } from '@/shared/lib/sort.constants';

export const metadata: Metadata = { title: 'Repositories' };

interface ReposPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ReposPage({ searchParams }: ReposPageProps) {
  const params = repoListParamsSchema.parse(await withCachedOrdering(SortTable.REPOS, await searchParams));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Repositories" description="Repositories, most recently analysed first." />
        <RequirePermission permission={Permission.REPO_ANALYSIS}>
          <Link href="/repos/new" className={buttonVariants({ size: 'sm' })}>
            Create repository
          </Link>
        </RequirePermission>
      </div>
      <RepoListView params={params} />
    </>
  );
}
