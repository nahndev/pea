import type { Metadata } from 'next';
import { MetricsView } from '@/modules/metrics';

export const metadata: Metadata = { title: 'Analysis metrics' };

interface MetricsPageProps {
  params: Promise<{ id: string }>;
}

export default async function MetricsPage({ params }: MetricsPageProps) {
  const { id: analysisId } = await params;

  return <MetricsView analysisId={analysisId} />;
}
