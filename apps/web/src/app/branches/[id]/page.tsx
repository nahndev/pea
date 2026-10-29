import type { Metadata } from 'next';
import { AnalysisListView } from '@/modules/analyses';
import { BranchHeader, BranchSchemaTabs, branchDetailParamsSchema } from '@/modules/branches';
import { TrendChartBySchema } from '@/modules/metrics';

export const metadata: Metadata = { title: 'Branch analyses' };

interface BranchPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BranchPage({ params, searchParams }: BranchPageProps) {
  const { id: branchId } = await params;
  const { schema, page } = branchDetailParamsSchema.parse(await searchParams);

  return (
    <>
      <BranchHeader branchId={branchId} schema={schema} />
      <BranchSchemaTabs branchId={branchId} schema={schema} />
      <TrendChartBySchema schema={schema} branchId={branchId} />
      <AnalysisListView branchId={branchId} schema={schema} page={page} />
    </>
  );
}
