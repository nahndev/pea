import type { Metadata } from 'next';
import { MetricsView, metricPageParamsSchema } from '@/modules/metrics';

export const metadata: Metadata = { title: 'Analysis metrics' };

interface MetricsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MetricsPage({ params, searchParams }: MetricsPageProps) {
  const { id: analysisId } = await params;
  const filters = metricPageParamsSchema.parse(await searchParams);

  return <MetricsView analysisId={analysisId} params={filters} />;
}
