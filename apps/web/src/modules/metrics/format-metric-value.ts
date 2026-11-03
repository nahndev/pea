import { MetricUnit } from '@tomato/constants';
import { formatDuration, formatNumber, formatPercent } from '@/shared/lib/format';

const FORMAT_BY_UNIT: Record<MetricUnit, (value: number) => string> = {
  [MetricUnit.MILLISECOND]: formatDuration,
  [MetricUnit.COUNT]: formatNumber,
  [MetricUnit.PERCENT]: formatPercent,
};

export const formatMetricValue = (unit: MetricUnit, value: number) => FORMAT_BY_UNIT[unit](value);
