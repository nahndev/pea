'use client';

import { AnalysisSchema } from '@tomato/constants';
import { MetricTrendChart, type TrendChartProps } from './metric-trend-chart';

export const ApiTrendChart = (props: TrendChartProps) => (
  <MetricTrendChart schema={AnalysisSchema.API} title="API trend" defaultMetrics="P50, P90 and P95" {...props} />
);
