'use client';

import { AnalysisSchema } from '@tomato/constants';
import { MetricTrendChart, type TrendChartProps } from './metric-trend-chart';

export const QueryTrendChart = (props: TrendChartProps) => (
  <MetricTrendChart schema={AnalysisSchema.QUERY} title="Query trend" defaultMetrics="The default metrics" {...props} />
);
