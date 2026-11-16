'use client';

import { AnalysisSchema } from '@tomato/constants';
import { MetricTrendChart, type TrendChartProps } from './metric-trend-chart';

export const FrontendTrendChart = (props: TrendChartProps) => (
  <MetricTrendChart schema={AnalysisSchema.FRONTEND} title="Frontend performance trend" {...props} />
);
