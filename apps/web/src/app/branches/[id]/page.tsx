import type { Metadata } from 'next';
import { AnalysisListView, pageParamsSchema } from '@/modules/analyses';
import { BranchHeader } from '@/modules/branches';
import { MetricTrendChart } from '@/modules/metrics';

export const metadata: Metadata = { title: 'Branch analyses' };

interface BranchPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BranchPage({ params, searchParams }: BranchPageProps) {
  const { id: branchId } = await params;
  const { page } = pageParamsSchema.parse(await searchParams);

  return (
    <>
      <BranchHeader branchId={branchId} />
      <MetricTrendChart branchId={branchId} />
      <AnalysisListView branchId={branchId} page={page} />
    </>
  );
}
