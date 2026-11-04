import type { Metadata } from 'next';
import { MetricsView, metricResultListParamsSchema } from '@/modules/metrics';
import { withCachedOrdering } from '@/shared/lib/sort-cache';
import { SortTable } from '@/shared/lib/sort.constants';

export const metadata: Metadata = { title: 'Analysis metrics' };

interface MetricsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MetricsPage({ params, searchParams }: MetricsPageProps) {
  const { id: analysisId } = await params;
  const filters = metricResultListParamsSchema.parse(await withCachedOrdering(SortTable.METRIC_RESULTS, await searchParams));

  return <MetricsView analysisId={analysisId} params={filters} />;
}
