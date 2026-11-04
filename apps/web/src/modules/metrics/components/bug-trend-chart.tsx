'use client';

import { AnalysisSchema } from '@tomato/constants';
import { MetricTrendChart, type TrendChartProps } from './metric-trend-chart';

export const BugTrendChart = (props: TrendChartProps) => (
  <MetricTrendChart schema={AnalysisSchema.BUG} title="Bug trend" defaultMetrics="Errors, critical errors and distinct errors" {...props} />
);
