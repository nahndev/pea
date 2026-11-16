import { buttonVariants } from '@tomato/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { GroupListView, groupListParamsSchema } from '@/modules/groups';
import { PageHeader } from '@/shared/components/page-header';
import { withCachedOrdering } from '@/shared/lib/sort-cache';
import { SortTable } from '@/shared/lib/sort.constants';

export const metadata: Metadata = { title: 'Groups' };

interface GroupsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GroupsPage({ searchParams }: GroupsPageProps) {
  const params = groupListParamsSchema.parse(await withCachedOrdering(SortTable.GROUPS, await searchParams));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Groups" description="Users get the permissions of their group. Open a group to change its permissions." />
        <Link href="/groups/new" className={buttonVariants({ size: 'sm' })}>
          Add group
        </Link>
      </div>
      <GroupListView params={params} />
    </>
  );
}
