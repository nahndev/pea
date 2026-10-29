'use client';

import { AnalysisSchema } from '@tomato/constants';
import type { ComponentType } from 'react';
import { ApiTrendChart } from './api-trend-chart';
import { BugTrendChart } from './bug-trend-chart';
import type { TrendChartProps } from './metric-trend-chart';
import { QueryTrendChart } from './query-trend-chart';

const TREND_CHART_BY_SCHEMA: Record<AnalysisSchema, ComponentType<TrendChartProps>> = {
  [AnalysisSchema.API]: ApiTrendChart,
  [AnalysisSchema.QUERY]: QueryTrendChart,
  [AnalysisSchema.BUG]: BugTrendChart,
};

export function TrendChartBySchema({ schema, ...props }: TrendChartProps & { schema: AnalysisSchema }) {
  const TrendChart = TREND_CHART_BY_SCHEMA[schema];
  return <TrendChart {...props} />;
}
