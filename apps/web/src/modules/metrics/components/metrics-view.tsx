'use client';

import { Skeleton } from '@tomato/ui';
import { useState } from 'react';
import { useAnalysis } from '@/modules/analyses';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { useMetricResults } from '../hooks/use-metrics';
import { metricSeriesKey } from '../metric-series';
import { summarizeMetrics } from '../summarize-metrics';
import { MetricResultsTable } from './metric-results-table';
import { MetricSummaryCards } from './metric-summary-cards';
import { TrendChartBySchema } from './trend-chart.factory';

interface MetricsViewProps {
  analysisId: string;
}

export function MetricsView({ analysisId }: MetricsViewProps) {
  const { data: results, error, isPending } = useMetricResults(analysisId);
  const { data: analysis } = useAnalysis(analysisId);
  const [picked, setPicked] = useState<string[]>([]);

  const toggle = (key: string) =>
    setPicked((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));

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
  const limits: Record<string, number> = {};
  for (const { metric, subject, evaluations } of results) {
    const [first] = evaluations;
    if (first) limits[metricSeriesKey(metric.id, subject)] ??= first.threshold;
  }

  return (
    <div className="flex flex-col gap-6">
      <MetricSummaryCards summaries={summaries} />
      {analysis ? (
        <TrendChartBySchema schema={analysis.schema} branchId={analysis.branch.id} picks={picked} limits={limits} onClear={() => setPicked([])} />
      ) : null}
      <section className="flex flex-col gap-3" aria-labelledby="metric-results-heading">
        <h2 id="metric-results-heading" className="text-lg font-semibold">
          Results
        </h2>
        <MetricResultsTable results={results} picked={picked} onToggle={toggle} />
      </section>
    </div>
  );
}
