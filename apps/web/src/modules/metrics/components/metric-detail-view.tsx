'use client';

import { Skeleton } from '@tomato/ui';
import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { ErrorState } from '@/shared/components/error-state';
import { PageHeader } from '@/shared/components/page-header';
import { useMetric } from '../hooks/use-metrics';
import { METRIC_LABEL, METRIC_UNIT_LABEL } from '../metrics.constants';
import { MetricForm } from './metric-form';

interface MetricDetailViewProps {
  metricId: string;
}

export function MetricDetailView({ metricId }: MetricDetailViewProps) {
  const { data, error } = useMetric(metricId);

  if (error) return <ErrorState error={error} />;
  if (!data) return <Skeleton className="h-40 w-full max-w-2xl" />;

  const title = METRIC_LABEL[data.type];

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title={title} description={`${data.type} · measured in ${METRIC_UNIT_LABEL[data.unit]}. Past results are kept when a metric is disabled.`}>
        <Breadcrumbs entries={[{ label: 'Metrics', href: '/metrics' }, { label: title }]} />
      </PageHeader>
      <MetricForm key={`${data.description}:${data.isActive}`} metric={data} />
    </div>
  );
}
