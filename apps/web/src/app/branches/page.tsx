import { buttonVariants } from '@tomato/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BranchListView, branchListParamsSchema } from '@/modules/branches';
import { PageHeader } from '@/shared/components/page-header';

export const metadata: Metadata = { title: 'Branches' };

interface BranchesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BranchesPage({ searchParams }: BranchesPageProps) {
  const { page, q } = branchListParamsSchema.parse(await searchParams);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Branches" description="Branches, most recently analysed first." />
        <Link href="/branches/new" className={buttonVariants({ size: 'sm' })}>
          Create branch
        </Link>
      </div>
      <BranchListView page={page} search={q} />
    </>
  );
}
