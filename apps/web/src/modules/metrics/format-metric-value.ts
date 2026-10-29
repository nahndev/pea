import type { MetricType } from '@tomato/constants';
import { formatDuration, formatNumber } from '@/shared/lib/format';
import { isCountMetric } from './metrics.constants';

export const formatMetricValue = (type: MetricType, value: number) =>
  isCountMetric(type) ? formatNumber(value) : formatDuration(value);
