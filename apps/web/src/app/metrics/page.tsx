import type { Metadata } from 'next';
import { MetricListView } from '@/modules/metrics';
import { PageHeader } from '@/shared/components/page-header';

export const metadata: Metadata = { title: 'Metrics' };

export default function MetricsPage() {
  return (
    <>
      <PageHeader title="Metrics" description="Values measured for every analysis. Open a metric to edit or disable it." />
      <MetricListView />
    </>
  );
}
