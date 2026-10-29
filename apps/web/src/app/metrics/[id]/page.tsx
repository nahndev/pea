import type { Metadata } from 'next';
import { MetricDetailView } from '@/modules/metrics';

export const metadata: Metadata = { title: 'Metric' };

interface MetricPageProps {
  params: Promise<{ id: string }>;
}

export default async function MetricPage({ params }: MetricPageProps) {
  const { id } = await params;

  return <MetricDetailView metricId={id} />;
}
