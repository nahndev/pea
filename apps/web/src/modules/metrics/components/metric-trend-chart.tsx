'use client';

import { MetricUnit } from '@tomato/constants';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, Skeleton, type ChartConfig } from '@tomato/ui';
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { useMetricTrend } from '../hooks/use-metrics';
import { metricSeriesLabel } from '../metric-series';
import { formatMetricValue } from '../format-metric-value';
import { TREND_LIMIT } from '../metrics.constants';

const SHORT_DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const SERIES_COLORS = ['var(--info)', 'var(--primary)', 'var(--warning)', 'var(--success)', 'var(--danger)', 'var(--accent)'];

interface MetricTrendChartProps {
  branchId: string | undefined;
  picks?: string[];
  limits?: Record<string, number>;
  onClear?: () => void;
}

const NO_PICKS: string[] = [];

export function MetricTrendChart({ branchId, picks = NO_PICKS, limits = {}, onClear }: MetricTrendChartProps) {
  const { data, error, isPending } = useMetricTrend(branchId, picks);

  const series = (data?.series ?? []).map((item, index) => ({
    ...item,
    dataKey: `s${index}`,
    label: metricSeriesLabel(item.metric.type, item.subject),
    color: SERIES_COLORS[index % SERIES_COLORS.length],
  }));
  const points = (data?.points ?? []).map(({ analysisId, createdAt, values }) => ({
    analysisId,
    label: SHORT_DATE.format(new Date(createdAt)),
    ...Object.fromEntries(series.map(({ key, dataKey }) => [dataKey, values[key]])),
  }));
  const chartConfig: ChartConfig = Object.fromEntries(series.map(({ dataKey, label, color }) => [dataKey, { label, color }]));
  const unit = series[0]?.metric.unit ?? MetricUnit.MILLISECOND;
  const format = (value: number) => formatMetricValue(unit, value);
  const hasLimits = series.some(({ key }) => limits[key] !== undefined);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <CardTitle>Metric trend</CardTitle>
            <CardDescription>
              {picks.length > 0 ? 'The metrics you picked in the table below' : onClear ? 'P50, P90 and P95 (tick rows below to pick others)' : 'P50, P90 and P95'}, averaged per analysis over this branch’s last {TREND_LIMIT} analyses.
              {hasLimits ? ' Dashed lines mark the quality gate limits.' : ''}
            </CardDescription>
          </div>
          {picks.length > 0 && onClear ? (
            <Button type="button" size="sm" variant="ghost" intent="neutral" onClick={onClear}>
              Reset
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {error ? <ErrorState error={error} /> : null}
        {isPending && branchId !== undefined ? <Skeleton className="h-64 w-full" /> : null}
        {data && series.length === 0 ? <EmptyState title="No metrics recorded yet" /> : null}
        {data && series.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <LineChart data={points} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
              <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={format} />
              <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => format(Number(value))} />} />
              <ChartLegend content={<ChartLegendContent />} />
              {series.map(({ dataKey }) => (
                <Line key={dataKey} type="monotone" dataKey={dataKey} stroke={`var(--color-${dataKey})`} strokeWidth={2} dot={{ r: 3 }} connectNulls />
              ))}
              {series.map(({ key, dataKey }) =>
                limits[key] !== undefined ? (
                  <ReferenceLine key={`limit-${dataKey}`} y={limits[key]} stroke={`var(--color-${dataKey})`} strokeDasharray="4 4" ifOverflow="extendDomain" />
                ) : null,
              )}
            </LineChart>
          </ChartContainer>
        ) : null}
      </CardContent>
    </Card>
  );
}
