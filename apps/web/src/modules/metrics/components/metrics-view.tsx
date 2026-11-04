'use client';

import type { MetricUnit } from '@tomato/constants';
import type { MetricResultView } from '@tomato/types';
import { Skeleton } from '@tomato/ui';
import { useState } from 'react';
import { useAnalysis } from '@/modules/analyses';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { PaginationBar } from '@/shared/components/pagination-bar';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { buildHref } from '@/shared/lib/pagination';
import { useMetricResults, useMetricSummaries } from '../hooks/use-metrics';
import { metricSeriesKey } from '../metric-series';
import { METRIC_RESULTS_ANCHOR } from '../metrics.constants';
import type { MetricResultListParams } from '../metrics.schemas';
import { MetricResultFilters } from './metric-result-filters';
import { MetricResultsTable } from './metric-results-table';
import { MetricSummaryCards } from './metric-summary-cards';
import { TrendChartBySchema } from './trend-chart.factory';

interface MetricsViewProps {
  analysisId: string;
  params: MetricResultListParams;
}

interface PickedSeries {
  key: string;
  unit: MetricUnit;
  limit?: number;
}

export function MetricsView({ analysisId, params }: MetricsViewProps) {
  const { page, metricType, subjectUuid, ordering } = params;
  const { data: results, error, isPending } = useMetricResults(analysisId, params);
  const { data: summaries } = useMetricSummaries(analysisId);
  const { data: analysis } = useAnalysis(analysisId);
  const [picked, setPicked] = useState<PickedSeries[]>([]);
  const pathname = `/analyses/${analysisId}/metrics`;
  const hasFilters = Boolean(metricType || subjectUuid);

  const toggle = ({ metric, subject, evaluations }: MetricResultView) => {
    const key = metricSeriesKey(metric.id, subject);
    setPicked((current) =>
      current.some((item) => item.key === key)
        ? current.filter((item) => item.key !== key)
        : [...current, { key, unit: metric.unit, limit: evaluations[0]?.threshold }],
    );
  };

  if (error) return <ErrorState error={error} />;
  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-32 w-full" />
        <TableSkeleton />
      </div>
    );
  }
  if (results.total === 0 && !hasFilters) {
    return <EmptyState title="No metrics yet">Metrics appear once the analysis has finished.</EmptyState>;
  }

  const limits: Record<string, number> = {};
  for (const { key, limit } of picked) if (limit !== undefined) limits[key] = limit;

  return (
    <div className="flex flex-col gap-6">
      {summaries ? <MetricSummaryCards summaries={summaries} /> : null}
      {analysis ? (
        <TrendChartBySchema
          schema={analysis.schema}
          branchId={analysis.branch.id}
          picks={picked.map(({ key }) => key)}
          limits={limits}
          onClear={() => setPicked([])}
        />
      ) : null}
      <section className="flex flex-col gap-3" aria-labelledby={METRIC_RESULTS_ANCHOR}>
        <h2 id={METRIC_RESULTS_ANCHOR} className="scroll-mt-4 text-lg font-semibold">
          Results
        </h2>
        <MetricResultFilters analysisId={analysisId} params={params} />
        {results.total === 0 ? (
          <EmptyState title="No result matches these filters">Clear a filter to see more.</EmptyState>
        ) : (
          <>
            <MetricResultsTable
              results={results.items}
              pickedKeys={picked.map(({ key }) => key)}
              pickedUnit={picked[0]?.unit}
              onToggle={toggle}
              ordering={ordering}
              sortHref={(next) => `${buildHref(pathname, { metricType, subjectUuid, ordering: next })}#${METRIC_RESULTS_ANCHOR}`}
            />
            <PaginationBar
              page={page}
              total={results.total}
              buildHref={(target) => `${buildHref(pathname, { page: target > 1 ? target : undefined, metricType, subjectUuid, ordering })}#${METRIC_RESULTS_ANCHOR}`}
            />
          </>
        )}
      </section>
    </div>
  );
}
