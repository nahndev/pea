'use client';

import type { MetricType } from '@tomato/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, Skeleton, type ChartConfig } from '@tomato/ui';
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { formatDuration } from '@/shared/lib/format';
import { useMetricTrend } from '../hooks/use-metrics';
import { METRIC_LABEL, METRIC_TYPES, TREND_LIMIT } from '../metrics.constants';

const SHORT_DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const CHART_CONFIG = {
  P50: { label: METRIC_LABEL.P50, color: 'var(--info)' },
  P90: { label: METRIC_LABEL.P90, color: 'var(--primary)' },
  P95: { label: METRIC_LABEL.P95, color: 'var(--warning)' },
} satisfies ChartConfig;

interface MetricTrendChartProps {
  branchId: string | undefined;
  limits?: Partial<Record<MetricType, number>>;
}

export function MetricTrendChart({ branchId, limits = {} }: MetricTrendChartProps) {
  const { data, error, isPending } = useMetricTrend(branchId);

  const points = (data ?? []).map(({ analysisId, createdAt, values }) => ({
    analysisId,
    label: SHORT_DATE.format(new Date(createdAt)),
    ...values,
  }));
  const shownTypes = METRIC_TYPES.filter((type) => points.some((point) => point[type] !== undefined));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Duration trend</CardTitle>
        <CardDescription>
          Average per analysis over this branch’s last {TREND_LIMIT} analyses.
          {Object.keys(limits).length > 0 ? ' Dashed lines mark the quality gate limits.' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? <ErrorState error={error} /> : null}
        {isPending && branchId !== undefined ? <Skeleton className="h-64 w-full" /> : null}
        {data && shownTypes.length === 0 ? <EmptyState title="No metrics recorded yet" /> : null}
        {data && shownTypes.length > 0 ? (
          <ChartContainer config={CHART_CONFIG} className="h-64 w-full">
            <LineChart data={points} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
              <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={formatDuration} />
              <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => formatDuration(Number(value))} />} />
              <ChartLegend content={<ChartLegendContent />} />
              {shownTypes.map((type) => (
                <Line key={type} type="monotone" dataKey={type} stroke={`var(--color-${type})`} strokeWidth={2} dot={{ r: 3 }} connectNulls />
              ))}
              {shownTypes.map((type) =>
                limits[type] !== undefined ? (
                  <ReferenceLine key={`limit-${type}`} y={limits[type]} stroke={`var(--color-${type})`} strokeDasharray="4 4" ifOverflow="extendDomain" />
                ) : null,
              )}
            </LineChart>
          </ChartContainer>
        ) : null}
      </CardContent>
    </Card>
  );
}
