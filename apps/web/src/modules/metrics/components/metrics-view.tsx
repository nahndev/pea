'use client';

import type { MetricType } from '@tomato/constants';
import { Skeleton } from '@tomato/ui';
import { useAnalysis } from '@/modules/analyses';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { useMetricResults } from '../hooks/use-metrics';
import { summarizeMetrics } from '../summarize-metrics';
import { MetricResultsTable } from './metric-results-table';
import { MetricSummaryCards } from './metric-summary-cards';
import { MetricTrendChart } from './metric-trend-chart';

interface MetricsViewProps {
  analysisId: string;
}

export function MetricsView({ analysisId }: MetricsViewProps) {
  const { data: results, error, isPending } = useMetricResults(analysisId);
  const { data: analysis } = useAnalysis(analysisId);

  if (error) return <ErrorState error={error} />;
  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-32 w-full" />
        <TableSkeleton />
      </div>
    );
  }
  if (results.length === 0) {
    return <EmptyState title="No metrics yet">Metrics appear once the analysis has finished.</EmptyState>;
  }

  const summaries = summarizeMetrics(results);
  const limits: Partial<Record<MetricType, number>> = {};
  for (const { type, limit } of summaries) if (limit) limits[type] = limit.threshold;

  return (
    <div className="flex flex-col gap-6">
      <MetricSummaryCards summaries={summaries} />
      <MetricTrendChart branchId={analysis?.branch.id} limits={limits} />
      <section className="flex flex-col gap-3" aria-labelledby="metric-results-heading">
        <h2 id="metric-results-heading" className="text-lg font-semibold">
          Results by file
        </h2>
        <MetricResultsTable results={results} />
      </section>
    </div>
  );
}
