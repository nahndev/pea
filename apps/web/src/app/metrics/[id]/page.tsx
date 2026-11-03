import type { Metadata } from 'next';
import { MetricDetailView, metricPageParamsSchema } from '@/modules/metrics';

export const metadata: Metadata = { title: 'Metric' };

interface MetricPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MetricPage({ params, searchParams }: MetricPageProps) {
  const { id } = await params;
  const filters = metricPageParamsSchema.parse(await searchParams);

  return <MetricDetailView metricId={id} params={filters} />;
}
