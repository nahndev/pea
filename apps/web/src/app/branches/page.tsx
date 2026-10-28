import type { Metadata } from 'next';
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
      <PageHeader title="Branches" description="Branches that have been analysed, most recently active first." />
      <BranchListView page={page} search={q} />
    </>
  );
}
