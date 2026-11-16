import { buttonVariants } from '@tomato/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { UserListView, userListParamsSchema } from '@/modules/users';
import { PageHeader } from '@/shared/components/page-header';
import { withCachedOrdering } from '@/shared/lib/sort-cache';
import { SortTable } from '@/shared/lib/sort.constants';

export const metadata: Metadata = { title: 'Users' };

interface UsersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = userListParamsSchema.parse(await withCachedOrdering(SortTable.USERS, await searchParams));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Users" description="People who can sign in. Open a user to change their group or password." />
        <Link href="/users/new" className={buttonVariants({ size: 'sm' })}>
          Add user
        </Link>
      </div>
      <UserListView params={params} />
    </>
  );
}
