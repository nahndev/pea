'use client';

import { Skeleton } from '@tomato/ui';
import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { PageHeader } from '@/shared/components/page-header';
import { PaginationBar } from '@/shared/components/pagination-bar';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { buildHref } from '@/shared/lib/pagination';
import { ANALYSIS_SCHEMA_LABEL } from '@/shared/lib/analysis-schema.constants';
import { useMetric, useMetricHistory } from '../hooks/use-metrics';
import { METRIC_LABEL, METRIC_UNIT_LABEL } from '../metrics.constants';
import type { MetricPageParams } from '../metrics.schemas';
import { MetricForm } from './metric-form';
import { MetricHistoryTable } from './metric-history-table';
import { MetricOverview } from './metric-overview';

interface MetricDetailViewProps {
  metricId: string;
  params: MetricPageParams;
}

export function MetricDetailView({ metricId, params: { page } }: MetricDetailViewProps) {
  const { data, error } = useMetric(metricId);
  const history = useMetricHistory(metricId, page);

  if (error) return <ErrorState error={error} />;
  if (!data) return <Skeleton className="h-40 w-full" />;

  const title = METRIC_LABEL[data.type];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} description={`${ANALYSIS_SCHEMA_LABEL[data.schema]} · ${data.type} · measured in ${METRIC_UNIT_LABEL[data.unit]}`}>
        <Breadcrumbs entries={[{ label: 'Metrics', href: buildHref('/metrics', { schema: data.schema }) }, { label: title }]} />
      </PageHeader>
      <p className="max-w-3xl text-sm text-muted-foreground">{data.description}</p>
      <MetricOverview metric={data} total={history.data?.total} />
      <section className="flex flex-col gap-3" aria-labelledby="metric-history-heading">
        <h2 id="metric-history-heading" className="text-lg font-semibold">
          Results
        </h2>
        {history.isPending ? <TableSkeleton /> : null}
        {history.error ? <ErrorState error={history.error} /> : null}
        {history.data?.items.length === 0 ? (
          <EmptyState title="No result yet">Results appear once an analysis measures this metric.</EmptyState>
        ) : null}
        {history.data && history.data.items.length > 0 ? (
          <>
            <MetricHistoryTable metric={data} items={history.data.items} />
            <PaginationBar
              page={page}
              total={history.data.total}
              buildHref={(value) => buildHref(`/metrics/${metricId}`, { page: value > 1 ? value : undefined })}
            />
          </>
        ) : null}
      </section>
      <section className="flex max-w-2xl flex-col gap-3" aria-labelledby="metric-settings-heading">
        <div>
          <h2 id="metric-settings-heading" className="text-lg font-semibold">
            Settings
          </h2>
          <p className="text-sm text-muted-foreground">Past results are kept when a metric is disabled.</p>
        </div>
        <MetricForm key={`${data.description}:${data.isActive}:${data.include.join()}:${data.exclude.join()}`} metric={data} />
      </section>
    </div>
  );
}
