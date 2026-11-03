'use client';

import { AnalysisSchema } from '@tomato/constants';
import { MetricTrendChart, type TrendChartProps } from './metric-trend-chart';

export const DatabaseTrendChart = (props: TrendChartProps) => (
  <MetricTrendChart schema={AnalysisSchema.DATABASE} title="Database trend" defaultMetrics="The default metrics" {...props} />
);
