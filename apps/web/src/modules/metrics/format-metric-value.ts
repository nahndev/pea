import { MetricUnit } from '@tomato/constants';
import { formatDuration, formatNumber } from '@/shared/lib/format';

export const formatMetricValue = (unit: MetricUnit, value: number) =>
  unit === MetricUnit.COUNT ? formatNumber(value) : formatDuration(value);
