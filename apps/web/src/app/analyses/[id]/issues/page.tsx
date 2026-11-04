import type { Metadata } from 'next';
import { IssueListView, issueListParamsSchema } from '@/modules/issues';
import { withCachedOrdering } from '@/shared/lib/sort-cache';
import { SortTable } from '@/shared/lib/sort.constants';

export const metadata: Metadata = { title: 'Analysis issues' };

interface IssuesPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function IssuesPage({ params, searchParams }: IssuesPageProps) {
  const { id: analysisId } = await params;
  const filters = issueListParamsSchema.parse(await withCachedOrdering(SortTable.ISSUES, await searchParams));

  return <IssueListView analysisId={analysisId} params={filters} />;
}
